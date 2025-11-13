"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let TerminalService = class TerminalService {
    constructor() {
        this.sessions = new Map();
    }
    ensureSession(sessionId) {
        let st = this.sessions.get(sessionId);
        if (!st) {
            st = { cwd: process.env.HOME || os_1.default.homedir() };
            this.sessions.set(sessionId, st);
        }
        return st;
    }
    async execCommand(raw, sessionId) {
        const state = this.ensureSession(sessionId);
        const command = raw.trim();
        if (!command)
            return { stdout: '', stderr: '', cwd: state.cwd };
        // Handle built-ins (only cd and clear for now)
        if (command === 'clear') {
            return { stdout: '', stderr: '', cwd: state.cwd };
        }
        if (command.startsWith('cd')) {
            const target = command.substring(2).trim() || os_1.default.homedir();
            const newPath = target.startsWith('/') ? target : path_1.default.resolve(state.cwd, target);
            if (!fs_1.default.existsSync(newPath)) {
                return { stdout: '', stderr: `cd: no such file or directory: ${target}`, cwd: state.cwd };
            }
            const stat = fs_1.default.statSync(newPath);
            if (!stat.isDirectory()) {
                return { stdout: '', stderr: `cd: not a directory: ${target}`, cwd: state.cwd };
            }
            state.cwd = newPath;
            return { stdout: '', stderr: '', cwd: state.cwd };
        }
        return new Promise((resolve) => {
            (0, child_process_1.exec)(command, { timeout: 10000, maxBuffer: 1024 * 1024, cwd: state.cwd, env: process.env }, (error, stdout, stderr) => {
                if (error) {
                    resolve({ stdout, stderr: stderr || error.message, cwd: state.cwd });
                }
                else {
                    resolve({ stdout, stderr, cwd: state.cwd });
                }
            });
        });
    }
    getSessionInfo(sessionId) {
        const st = this.ensureSession(sessionId);
        return {
            cwd: st.cwd,
            user: process.env.USER || os_1.default.userInfo().username,
            host: os_1.default.hostname(),
        };
    }
};
exports.TerminalService = TerminalService;
exports.TerminalService = TerminalService = __decorate([
    (0, common_1.Injectable)()
], TerminalService);
//# sourceMappingURL=terminal.service.js.map