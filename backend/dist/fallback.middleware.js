"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackMiddleware = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
let FallbackMiddleware = class FallbackMiddleware {
    use(req, res, next) {
        // Let API routes pass through (use originalUrl to account for global prefix)
        if (req.originalUrl.startsWith('/api')) {
            return next();
        }
        // Only handle typical browser navigation requests (GET/HTML)
        if (req.method !== 'GET') {
            return next();
        }
        // Check if file exists in public directory
        const publicPath = (0, path_1.join)(__dirname, '..', 'public', req.path);
        if ((0, fs_1.existsSync)(publicPath) && !req.path.endsWith('/')) {
            return next();
        }
        // For all other routes, serve index.html (SPA fallback)
        res.sendFile((0, path_1.join)(__dirname, '..', 'public', 'index.html'));
    }
};
exports.FallbackMiddleware = FallbackMiddleware;
exports.FallbackMiddleware = FallbackMiddleware = __decorate([
    (0, common_1.Injectable)()
], FallbackMiddleware);
//# sourceMappingURL=fallback.middleware.js.map