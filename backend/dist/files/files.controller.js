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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const files_service_1 = require("./files.service");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
let FilesController = class FilesController {
    constructor(files) {
        this.files = files;
    }
    ensureAuth(req, res) {
        if (!req.session?.isAuthenticated) {
            res.status(common_1.HttpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
            return false;
        }
        return true;
    }
    async list(path, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        try {
            const data = await this.files.list(path || '');
            return res.json(data);
        }
        catch (e) {
            return res.status(400).json({ success: false, error: e.message });
        }
    }
    async mkdir(body, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        try {
            const data = await this.files.mkdir(body.path || '', body.name);
            return res.json(data);
        }
        catch (e) {
            return res.status(400).json({ success: false, error: e.message });
        }
    }
    async upload(body, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        const dest = body.path || '';
        const files = req.files || [];
        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded' });
        }
        const results = [];
        for (const f of files) {
            try {
                await this.files.writeFile(dest, f.originalname, f.buffer, false);
                results.push({ name: f.originalname, ok: true });
            }
            catch (e) {
                results.push({ name: f.originalname, ok: false, error: e.message });
            }
        }
        return res.json({ success: true, results });
    }
    async download(p, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        if (!p)
            return res.status(400).json({ success: false, error: 'path required' });
        try {
            const info = await this.files.getFileInfo(p);
            if (info.stat.isDirectory()) {
                return res.status(400).json({ success: false, error: 'Cannot download a directory' });
            }
            return res.download(info.full, path_1.default.basename(info.full));
        }
        catch (e) {
            return res.status(400).json({ success: false, error: e.message });
        }
    }
    async archive(body, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        const paths = body.paths || [];
        const name = body.name || 'archive.zip';
        if (!Array.isArray(paths) || paths.length === 0) {
            return res.status(400).json({ success: false, error: 'paths array required' });
        }
        try {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
            const zip = this.files.createArchiveStream(paths);
            zip.on('error', (err) => {
                if (!res.headersSent)
                    res.status(500);
                res.end(`Archive error: ${err.message}`);
            });
            zip.pipe(res);
            await zip.finalize();
        }
        catch (e) {
            if (!res.headersSent)
                return res.status(400).json({ success: false, error: e.message });
            res.end();
        }
    }
    async delete(body, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        const targets = body.paths || [];
        if (!Array.isArray(targets) || targets.length === 0) {
            return res.status(400).json({ success: false, error: 'paths array required' });
        }
        const results = [];
        for (const p of targets) {
            try {
                const r = await this.files.remove(p);
                results.push({ path: p, ok: true });
            }
            catch (e) {
                results.push({ path: p, ok: false, error: e.message });
            }
        }
        return res.json({ success: true, results });
    }
    async rename(body, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        if (!body.path || !body.newName) {
            return res.status(400).json({ success: false, error: 'path and newName required' });
        }
        try {
            const data = await this.files.rename(body.path, body.newName);
            return res.json(data);
        }
        catch (e) {
            return res.status(400).json({ success: false, error: e.message });
        }
    }
    async move(body, req, res) {
        if (!this.ensureAuth(req, res))
            return;
        const targets = body.paths || [];
        const dest = body.dest;
        if (!Array.isArray(targets) || targets.length === 0 || !dest) {
            return res.status(400).json({ success: false, error: 'paths[] and dest required' });
        }
        try {
            const data = await this.files.move(targets, dest);
            return res.json(data);
        }
        catch (e) {
            return res.status(400).json({ success: false, error: e.message });
        }
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('path')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('mkdir'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "mkdir", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({
        storage: multer_1.default.memoryStorage(),
        limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 104857600) },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)('path')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "download", null);
__decorate([
    (0, common_1.Post)('archive'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)('delete'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('rename'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "rename", null);
__decorate([
    (0, common_1.Post)('move'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "move", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map