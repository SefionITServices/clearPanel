"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_session_1 = __importDefault(require("express-session"));
const config_1 = require("@nestjs/config");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    // When behind Cloudflare/NGINX/etc., trust the proxy to get correct protocol/IP
    app.set('trust proxy', 1);
    app.use((0, express_session_1.default)({
        secret: config.get('SESSION_SECRET') || 'change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            // Allow overriding cookie security for HTTP tunnels/port-forwarding
            // Set SESSION_SECURE=true only when serving via HTTPS end-to-end
            secure: (config.get('SESSION_SECURE') || '').toLowerCase() === 'true'
                || config.get('NODE_ENV') === 'production' && (config.get('FORCE_SECURE') || '').toLowerCase() === 'true',
            httpOnly: true,
            sameSite: 'lax',
        }
    }));
    app.setGlobalPrefix('api');
    // Serve static frontend files in production
    if (config.get('NODE_ENV') === 'production') {
        app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'));
        app.setBaseViewsDir((0, path_1.join)(__dirname, '..', 'public'));
    }
    const port = config.get('PORT') || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Nest backend running on http://localhost:${port}`);
    console.log(`Environment: ${config.get('NODE_ENV') || 'development'}`);
}
bootstrap();
//# sourceMappingURL=main.js.map