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
exports.DnsController = void 0;
const common_1 = require("@nestjs/common");
const dns_service_1 = require("./dns.service");
let DnsController = class DnsController {
    constructor(dnsService) {
        this.dnsService = dnsService;
    }
    async listZones() {
        return this.dnsService.listZones();
    }
    async getZone(domain) {
        return this.dnsService.getZone(domain);
    }
    async addRecord(domain, body) {
        return this.dnsService.addRecord(domain, { type: body.type, name: body.name, value: body.value, ttl: body.ttl ?? 3600, priority: body.priority });
    }
    async updateRecord(domain, id, body) {
        return this.dnsService.updateRecord(domain, id, body);
    }
    async deleteRecord(domain, id) {
        return { deleted: await this.dnsService.deleteRecord(domain, id) };
    }
};
exports.DnsController = DnsController;
__decorate([
    (0, common_1.Get)('zones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DnsController.prototype, "listZones", null);
__decorate([
    (0, common_1.Get)('zones/:domain'),
    __param(0, (0, common_1.Param)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DnsController.prototype, "getZone", null);
__decorate([
    (0, common_1.Post)('zones/:domain/records'),
    __param(0, (0, common_1.Param)('domain')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DnsController.prototype, "addRecord", null);
__decorate([
    (0, common_1.Put)('zones/:domain/records/:id'),
    __param(0, (0, common_1.Param)('domain')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DnsController.prototype, "updateRecord", null);
__decorate([
    (0, common_1.Delete)('zones/:domain/records/:id'),
    __param(0, (0, common_1.Param)('domain')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DnsController.prototype, "deleteRecord", null);
exports.DnsController = DnsController = __decorate([
    (0, common_1.Controller)('dns'),
    __metadata("design:paramtypes", [dns_service_1.DnsService])
], DnsController);
//# sourceMappingURL=dns.controller.js.map