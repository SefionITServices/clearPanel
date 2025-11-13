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
exports.WebServerController = void 0;
const common_1 = require("@nestjs/common");
const webserver_service_1 = require("./webserver.service");
const config_1 = require("@nestjs/config");
let WebServerController = class WebServerController {
    constructor(webServerService, configService) {
        this.webServerService = webServerService;
        this.configService = configService;
    }
    async getStatus() {
        return this.webServerService.getNginxStatus();
    }
    async installNginx() {
        return this.webServerService.installNginx();
    }
    async createVirtualHost(domain, body) {
        return this.webServerService.createVirtualHost(domain, body.documentRoot);
    }
    async removeVirtualHost(domain) {
        return this.webServerService.removeVirtualHost(domain);
    }
    async getDNSInstructions(domain) {
        const serverIp = this.configService.get('SERVER_IP') || '0.0.0.0';
        const instructions = this.webServerService.getDNSInstructions(domain, serverIp);
        return { domain, serverIp, instructions };
    }
};
exports.WebServerController = WebServerController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebServerController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('install'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebServerController.prototype, "installNginx", null);
__decorate([
    (0, common_1.Post)('vhost/:domain'),
    __param(0, (0, common_1.Param)('domain')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebServerController.prototype, "createVirtualHost", null);
__decorate([
    (0, common_1.Delete)('vhost/:domain'),
    __param(0, (0, common_1.Param)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebServerController.prototype, "removeVirtualHost", null);
__decorate([
    (0, common_1.Get)('dns-instructions/:domain'),
    __param(0, (0, common_1.Param)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebServerController.prototype, "getDNSInstructions", null);
exports.WebServerController = WebServerController = __decorate([
    (0, common_1.Controller)('webserver'),
    __metadata("design:paramtypes", [webserver_service_1.WebServerService,
        config_1.ConfigService])
], WebServerController);
//# sourceMappingURL=webserver.controller.js.map