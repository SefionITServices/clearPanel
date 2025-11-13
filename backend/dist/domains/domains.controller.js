"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainsController = void 0;
const common_1 = require("@nestjs/common");
const domains_service_1 = require("./domains.service");
const dns_service_1 = require("../dns/dns.service");
const webserver_service_1 = require("../webserver/webserver.service");
const dns_server_service_1 = require("../dns-server/dns-server.service");
const config_1 = require("@nestjs/config");
let DomainsController = class DomainsController {
    constructor(domainsService, dnsService, webServerService, dnsServerService, configService) {
        this.domainsService = domainsService;
        this.dnsService = dnsService;
        this.webServerService = webServerService;
        this.dnsServerService = dnsServerService;
        this.configService = configService;
    }
    async addDomain(body) {
        const domain = await this.domainsService.addDomain(body.name, body.folderPath);
        // Return combined info with DNS zone for convenience
        const zone = await this.dnsService.getZone(body.name);
        const serverIp = this.configService.get('SERVER_IP') || '0.0.0.0';
        const dnsInstructions = this.webServerService.getDNSInstructions(body.name, serverIp);
        const nameserverInfo = await this.dnsServerService.getNameserverInstructions(body.name);
        return { domain, dnsZone: zone, dnsInstructions, nameserverInfo };
    }
    async listDomains() {
        return this.domainsService.listDomains();
    }
    async getDNSInstructions(id) {
        const domains = await this.domainsService.listDomains();
        const domain = domains.find(d => d.id === id);
        if (!domain) {
            return { success: false, message: 'Domain not found' };
        }
        const serverIp = this.configService.get('SERVER_IP') || '0.0.0.0';
        const dnsInstructions = this.webServerService.getDNSInstructions(domain.name, serverIp);
        return { domain: domain.name, serverIp, instructions: dnsInstructions };
    }
    async updateDomainPath(id, body) {
        return this.domainsService.updateDomainPath(id, body.folderPath);
    }
    async deleteDomain(id) {
        const result = await this.domainsService.deleteDomain(id);
        if (!result) {
            return { success: false, message: 'Domain not found' };
        }
        return { success: true, message: 'Domain deleted successfully', domain: result };
    }
};
exports.DomainsController = DomainsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DomainsController.prototype, "addDomain", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DomainsController.prototype, "listDomains", null);
__decorate([
    (0, common_1.Get)(':id/dns-instructions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DomainsController.prototype, "getDNSInstructions", null);
__decorate([
    (0, common_1.Put)(':id/path'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DomainsController.prototype, "updateDomainPath", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DomainsController.prototype, "deleteDomain", null);
exports.DomainsController = DomainsController = __decorate([
    (0, common_1.Controller)('domains'),
    __metadata("design:paramtypes", [domains_service_1.DomainsService,
        dns_service_1.DnsService,
        webserver_service_1.WebServerService,
        dns_server_service_1.DnsServerService,
        config_1.ConfigService])
], DomainsController);
//# sourceMappingURL=domains.controller.js.map