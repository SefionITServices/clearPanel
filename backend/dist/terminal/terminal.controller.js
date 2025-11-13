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
exports.TerminalController = void 0;
const common_1 = require("@nestjs/common");
const terminal_service_1 = require("./terminal.service");
const auth_guard_1 = require("../auth/auth.guard");
// Use plain 'terminal' because global prefix 'api' is set in main.ts
let TerminalController = class TerminalController {
    constructor(terminalService) {
        this.terminalService = terminalService;
    }
    getSessionId(req) {
        return (req.sessionID || 'default');
    }
    async exec(command, req) {
        return this.terminalService.execCommand(command, this.getSessionId(req));
    }
    async info(req) {
        return this.terminalService.getSessionInfo(this.getSessionId(req));
    }
};
exports.TerminalController = TerminalController;
__decorate([
    (0, common_1.Post)('exec'),
    __param(0, (0, common_1.Body)('command')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TerminalController.prototype, "exec", null);
__decorate([
    (0, common_1.Get)('info'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TerminalController.prototype, "info", null);
exports.TerminalController = TerminalController = __decorate([
    (0, common_1.Controller)('terminal'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [terminal_service_1.TerminalService])
], TerminalController);
//# sourceMappingURL=terminal.controller.js.map