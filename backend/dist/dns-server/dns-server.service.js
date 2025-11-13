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
var DnsServerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsServerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let DnsServerService = DnsServerService_1 = class DnsServerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(DnsServerService_1.name);
        this.zonesPath = '/etc/bind/zones';
        this.namedConfPath = '/etc/bind/named.conf.local';
        this.namedOptionsPath = '/etc/bind/named.conf.options';
    }
    async getStatus() {
        const status = {
            installed: false,
            running: false,
            zonesPath: this.zonesPath,
            namedConfPath: this.namedConfPath,
        };
        try {
            // Check if BIND9 is installed
            const { stdout } = await execAsync('named -v 2>&1 || true');
            if (stdout.includes('BIND')) {
                status.installed = true;
                status.version = stdout.trim().split('\n')[0];
            }
        }
        catch (error) {
            this.logger.debug('BIND9 not installed');
        }
        if (status.installed) {
            try {
                // Check if named service is running
                const { stdout } = await execAsync('systemctl is-active named || systemctl is-active bind9 || true');
                status.running = stdout.trim() === 'active';
            }
            catch (error) {
                this.logger.debug('Named service check failed');
            }
        }
        return status;
    }
    async install() {
        const status = await this.getStatus();
        if (status.installed) {
            return { success: true, message: 'BIND9 is already installed' };
        }
        try {
            this.logger.log('Installing BIND9...');
            // Detect package manager and install
            let installCmd = '';
            try {
                await execAsync('which apt-get');
                installCmd = 'apt-get update && apt-get install -y bind9 bind9utils bind9-doc';
            }
            catch {
                try {
                    await execAsync('which dnf');
                    installCmd = 'dnf install -y bind bind-utils';
                }
                catch {
                    return { success: false, message: 'Unsupported package manager. Please install BIND9 manually.' };
                }
            }
            const { stdout, stderr } = await execAsync(`sudo ${installCmd}`);
            // Create zones directory
            await execAsync(`sudo mkdir -p ${this.zonesPath}`);
            await execAsync(`sudo chown -R bind:bind ${this.zonesPath} || sudo chown -R named:named ${this.zonesPath} || true`);
            // Enable and start the service
            const serviceName = await this.getServiceName();
            await execAsync(`sudo systemctl enable ${serviceName}`);
            await execAsync(`sudo systemctl start ${serviceName}`);
            this.logger.log('BIND9 installed and started successfully');
            return {
                success: true,
                message: 'BIND9 installed successfully',
                output: stdout + stderr
            };
        }
        catch (error) {
            this.logger.error('BIND9 installation failed', error);
            return {
                success: false,
                message: `Installation failed: ${error?.message || 'Unknown error'}`,
                output: error?.stderr || error?.stdout || ''
            };
        }
    }
    async createZone(domain, serverIp) {
        const status = await this.getStatus();
        if (!status.installed) {
            return { success: false, message: 'BIND9 is not installed. Please install it first.' };
        }
        const ip = serverIp || this.configService.get('SERVER_IP') || '0.0.0.0';
        const serial = this.generateSerial();
        const zoneFile = path.join(this.zonesPath, `db.${domain}`);
        try {
            // Create zone file content
            const zoneContent = `
; Zone file for ${domain}
$TTL 86400
@   IN  SOA ns1.${domain}. admin.${domain}. (
        ${serial}   ; Serial
        3600        ; Refresh
        1800        ; Retry
        604800      ; Expire
        86400 )     ; Minimum TTL

; Name servers
@       IN  NS      ns1.${domain}.
@       IN  NS      ns2.${domain}.

; A records for nameservers
ns1     IN  A       ${ip}
ns2     IN  A       ${ip}

; Main domain A record
@       IN  A       ${ip}
www     IN  A       ${ip}
`;
            // Write zone file
            await execAsync(`sudo bash -c 'echo "${zoneContent.replace(/'/g, "'\\''")} " > ${zoneFile}'`);
            await execAsync(`sudo chown bind:bind ${zoneFile} || sudo chown named:named ${zoneFile} || true`);
            await execAsync(`sudo chmod 644 ${zoneFile}`);
            // Add zone to named.conf.local
            await this.addZoneToConfig(domain, zoneFile);
            // Reload BIND
            await this.reload();
            this.logger.log(`DNS zone created for ${domain}`);
            return { success: true, message: `DNS zone created for ${domain}` };
        }
        catch (error) {
            this.logger.error(`Failed to create zone for ${domain}`, error);
            return { success: false, message: `Failed to create zone: ${error?.message || 'Unknown error'}` };
        }
    }
    async deleteZone(domain) {
        const status = await this.getStatus();
        if (!status.installed) {
            return { success: false, message: 'BIND9 is not installed' };
        }
        try {
            const zoneFile = path.join(this.zonesPath, `db.${domain}`);
            // Remove zone from named.conf.local
            await this.removeZoneFromConfig(domain);
            // Delete zone file
            await execAsync(`sudo rm -f ${zoneFile}`);
            // Reload BIND
            await this.reload();
            this.logger.log(`DNS zone deleted for ${domain}`);
            return { success: true, message: `DNS zone deleted for ${domain}` };
        }
        catch (error) {
            this.logger.error(`Failed to delete zone for ${domain}`, error);
            return { success: false, message: `Failed to delete zone: ${error?.message || 'Unknown error'}` };
        }
    }
    async reload() {
        const serviceName = await this.getServiceName();
        try {
            await execAsync(`sudo systemctl reload ${serviceName}`);
            this.logger.log('BIND9 reloaded successfully');
        }
        catch (error) {
            this.logger.warn('BIND9 reload failed, trying restart', error);
            await execAsync(`sudo systemctl restart ${serviceName}`);
        }
    }
    async getNameserverInstructions(domain) {
        const ip = this.configService.get('SERVER_IP') || '0.0.0.0';
        return {
            ns1: `ns1.${domain}`,
            ns2: `ns2.${domain}`,
            ip,
            instructions: `
To use this VPS as your DNS server:

1. At your domain registrar, set custom nameservers:
   - Nameserver 1: ns1.${domain}
   - Nameserver 2: ns2.${domain}

2. Create glue records (required):
   - ns1.${domain} → ${ip}
   - ns2.${domain} → ${ip}

3. DNS propagation may take 24-48 hours.

4. Verify with: dig @${ip} ${domain}
`.trim()
        };
    }
    async addZoneToConfig(domain, zoneFile) {
        const zoneBlock = `
zone "${domain}" {
    type master;
    file "${zoneFile}";
    allow-transfer { any; };
};
`;
        // Check if zone already exists
        try {
            const { stdout } = await execAsync(`sudo grep -q 'zone "${domain}"' ${this.namedConfPath} && echo exists || echo new`);
            if (stdout.trim() === 'exists') {
                this.logger.log(`Zone ${domain} already in config, skipping`);
                return;
            }
        }
        catch (error) {
            // File might not exist or grep failed, continue
        }
        await execAsync(`sudo bash -c 'echo "${zoneBlock.replace(/'/g, "'\\''")} " >> ${this.namedConfPath}'`);
    }
    async removeZoneFromConfig(domain) {
        // Remove zone block from named.conf.local
        const sedCmd = `sudo sed -i '/^zone "${domain}"/,/^};/d' ${this.namedConfPath}`;
        await execAsync(sedCmd);
    }
    async getServiceName() {
        // BIND service is called 'named' on RHEL/CentOS, 'bind9' on Debian/Ubuntu
        try {
            await execAsync('systemctl list-units --type=service | grep bind9');
            return 'bind9';
        }
        catch {
            return 'named';
        }
    }
    generateSerial() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 100)).padStart(2, '0');
        return `${year}${month}${day}${seq}`;
    }
};
exports.DnsServerService = DnsServerService;
exports.DnsServerService = DnsServerService = DnsServerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DnsServerService);
//# sourceMappingURL=dns-server.service.js.map