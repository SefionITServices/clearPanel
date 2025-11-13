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
exports.DnsServerController = void 0;
const common_1 = require("@nestjs/common");
const dns_server_service_1 = require("./dns-server.service");
let DnsServerController = class DnsServerController {
    constructor(dnsServerService) {
        this.dnsServerService = dnsServerService;
    }
    async getStatus() {
        return this.dnsServerService.getStatus();
    }
    async install() {
        const result = await this.dnsServerService.install();
        if (!result.success) {
            throw new common_1.HttpException(result.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return result;
    }
    async reload() {
        try {
            await this.dnsServerService.reload();
            return { success: true, message: 'DNS server reloaded successfully' };
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to reload DNS server: ${error?.message || 'Unknown error'}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getNameserverInstructions(domain) {
        return this.dnsServerService.getNameserverInstructions(domain);
    }
};
exports.DnsServerController = DnsServerController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DnsServerController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('install'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DnsServerController.prototype, "install", null);
__decorate([
    (0, common_1.Post)('reload'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DnsServerController.prototype, "reload", null);
__decorate([
    (0, common_1.Get)('nameserver-instructions/:domain'),
    __param(0, (0, common_1.Param)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DnsServerController.prototype, "getNameserverInstructions", null);
exports.DnsServerController = DnsServerController = __decorate([
    (0, common_1.Controller)('dns-server'),
    __metadata("design:paramtypes", [dns_server_service_1.DnsServerService])
], DnsServerController);
//# sourceMappingURL=dns-server.controller.js.map