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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
let FilesService = class FilesService {
    constructor() {
        this.rootPath = process.env.ROOT_PATH || '/home';
    }
    validatePath(requestedPath) {
        const rel = (requestedPath || '.').replace(/^\/+/, '');
        const full = path_1.default.resolve(this.rootPath, rel);
        const rootResolved = path_1.default.resolve(this.rootPath);
        if (!full.startsWith(rootResolved))
            throw new Error('Access denied');
        return full;
    }
    async list(dir) {
        const dirPath = this.validatePath(dir);
        const items = await promises_1.default.readdir(dirPath, { withFileTypes: true });
        const list = await Promise.all(items.map(async (it) => {
            const p = path_1.default.join(dirPath, it.name);
            const stats = await promises_1.default.stat(p);
            return {
                name: it.name,
                type: it.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime,
                permissions: stats.mode.toString(8).slice(-3),
            };
        }));
        list.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1));
        return { success: true, path: dirPath, items: list };
    }
    async mkdir(dir, name) {
        const full = this.validatePath(path_1.default.join(dir || '', name));
        await promises_1.default.mkdir(full, { recursive: false });
        return { success: true, message: 'Directory created' };
    }
    async remove(target) {
        const full = this.validatePath(target);
        const stat = await promises_1.default.stat(full);
        if (stat.isDirectory()) {
            await promises_1.default.rm(full, { recursive: true, force: true });
        }
        else {
            await promises_1.default.unlink(full);
        }
        return { success: true, message: 'Removed' };
    }
    async rename(src, newName) {
        const srcFull = this.validatePath(src);
        const destFull = this.validatePath(path_1.default.join(path_1.default.dirname(src), newName));
        await promises_1.default.rename(srcFull, destFull);
        return { success: true, message: 'Renamed' };
    }
    async move(targets, destDir) {
        const destFull = this.validatePath(destDir);
        const results = [];
        for (const t of targets) {
            try {
                const srcFull = this.validatePath(t);
                const base = path_1.default.basename(srcFull);
                await promises_1.default.rename(srcFull, path_1.default.join(destFull, base));
                results.push({ name: base, ok: true });
            }
            catch (e) {
                results.push({ name: path_1.default.basename(t), ok: false, error: e.message });
            }
        }
        return { success: true, message: 'Moved', results };
    }
    async ensureDir(dir) {
        const full = this.validatePath(dir);
        await promises_1.default.mkdir(full, { recursive: true });
        return full;
    }
    async writeFile(destDir, filename, buffer, overwrite = false) {
        const dirFull = await this.ensureDir(destDir);
        let target = path_1.default.join(dirFull, path_1.default.basename(filename));
        const exists = fs_1.default.existsSync(target);
        if (exists && !overwrite) {
            throw new Error('File already exists');
        }
        await promises_1.default.writeFile(target, buffer);
        return { success: true, path: target };
    }
    createArchiveStream(pathsInput) {
        const zip = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        const rootResolved = path_1.default.resolve(this.rootPath);
        for (const p of pathsInput) {
            const full = this.validatePath(p);
            const name = path_1.default.relative(rootResolved, full) || path_1.default.basename(full);
            if (fs_1.default.statSync(full).isDirectory()) {
                zip.directory(full, name);
            }
            else {
                zip.file(full, { name });
            }
        }
        // Caller must pipe zip and call finalize when ready
        return zip;
    }
    async getFileInfo(p) {
        const full = this.validatePath(p);
        const stat = await promises_1.default.stat(full);
        return { full, stat };
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)()
], FilesService);
//# sourceMappingURL=files.service.js.map