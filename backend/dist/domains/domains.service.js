"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainsService = void 0;
const common_1 = require("@nestjs/common");
const dns_service_1 = require("../dns/dns.service");
const webserver_service_1 = require("../webserver/webserver.service");
const dns_server_service_1 = require("../dns-server/dns-server.service");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const os = __importStar(require("os"));
const DOMAINS_FILE = path.join(process.cwd(), 'domains.json');
const DOMAINS_ROOT = process.env.DOMAINS_ROOT || path.join(os.homedir(), 'clearPanel-domains');
let DomainsService = class DomainsService {
    constructor(dnsService, webServerService, dnsServerService) {
        this.dnsService = dnsService;
        this.webServerService = webServerService;
        this.dnsServerService = dnsServerService;
    }
    async readDomains() {
        try {
            const data = await fs.readFile(DOMAINS_FILE, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async writeDomains(domains) {
        await fs.writeFile(DOMAINS_FILE, JSON.stringify(domains, null, 2));
    }
    async addDomain(name, folderPath) {
        const domains = await this.readDomains();
        // Use provided path or default to DOMAINS_ROOT/domainname
        const defaultPath = path.join(DOMAINS_ROOT, name);
        const finalPath = folderPath || defaultPath;
        const domain = {
            id: (0, crypto_1.randomUUID)(),
            name,
            folderPath: finalPath,
            createdAt: new Date(),
        };
        // Create folder if not exists
        try {
            await fs.mkdir(domain.folderPath, { recursive: true });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error(`Failed to create directory ${domain.folderPath}:`, error);
            throw new Error(`Cannot create domain directory: ${errMsg}`);
        }
        // Ensure default DNS zone exists (A and CNAME records)
        try {
            await this.dnsService.ensureDefaultZone(name);
        }
        catch (e) {
            console.error('DNS zone creation failed:', e);
            // Continue even if DNS fails
        }
        // Create BIND9 DNS zone (authoritative DNS server)
        try {
            const dnsServerStatus = await this.dnsServerService.getStatus();
            if (dnsServerStatus.installed && dnsServerStatus.running) {
                const zoneResult = await this.dnsServerService.createZone(name);
                console.log(`DNS server zone: ${zoneResult.message}`);
            }
        }
        catch (e) {
            console.error('DNS server zone creation failed:', e);
            // Continue even if DNS server fails
        }
        // Auto-create nginx virtual host
        try {
            const vhostResult = await this.webServerService.createVirtualHost(name, domain.folderPath);
            console.log(`Virtual host setup: ${vhostResult.message}`);
        }
        catch (e) {
            console.error('Virtual host creation failed:', e);
            // Continue even if vhost fails
        }
        domains.push(domain);
        await this.writeDomains(domains);
        return domain;
    }
    async listDomains() {
        return this.readDomains();
    }
    async updateDomainPath(id, newPath) {
        const domains = await this.readDomains();
        const domain = domains.find((d) => d.id === id);
        if (!domain)
            return null;
        domain.folderPath = newPath;
        await fs.mkdir(newPath, { recursive: true });
        await this.writeDomains(domains);
        return domain;
    }
    async deleteDomain(id) {
        const domains = await this.readDomains();
        const domainIndex = domains.findIndex((d) => d.id === id);
        if (domainIndex === -1)
            return null;
        const domain = domains[domainIndex];
        // Remove DNS zone
        try {
            await this.dnsService.deleteZone(domain.name);
        }
        catch (e) {
            console.error('Failed to delete DNS zone:', e);
            // Continue even if DNS deletion fails
        }
        // Remove DNS server zone
        try {
            const dnsServerStatus = await this.dnsServerService.getStatus();
            if (dnsServerStatus.installed) {
                const zoneResult = await this.dnsServerService.deleteZone(domain.name);
                console.log(`DNS server zone removal: ${zoneResult.message}`);
            }
        }
        catch (e) {
            console.error('Failed to delete DNS server zone:', e);
            // Continue even if DNS server deletion fails
        }
        // Remove nginx virtual host
        try {
            const vhostResult = await this.webServerService.removeVirtualHost(domain.name);
            console.log(`Virtual host removal: ${vhostResult.message}`);
        }
        catch (e) {
            console.error('Failed to remove virtual host:', e);
            // Continue even if vhost removal fails
        }
        // Remove from list
        domains.splice(domainIndex, 1);
        await this.writeDomains(domains);
        return domain;
    }
};
exports.DomainsService = DomainsService;
exports.DomainsService = DomainsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dns_service_1.DnsService,
        webserver_service_1.WebServerService,
        dns_server_service_1.DnsServerService])
], DomainsService);
//# sourceMappingURL=domains.service.js.map
