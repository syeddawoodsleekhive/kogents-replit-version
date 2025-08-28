import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import { createHash } from 'crypto';

type InitParams = { workspaceId: string; sessionId: string; fileName: string; mimeType: string };
type AppendParams = { storageKey: string; chunkIndex: number; buffer: Buffer };
type FinalizeParams = { storageKey: string };
type PutParams = { workspaceId: string; fileName: string; mimeType: string; buffer: Buffer };
type DeleteTempParams = { storageKey: string };
type HashParams = { storageKey: string; algo?: 'sha256' | 'sha1' };

@Injectable()
export class LocalStorageAdapter {
    private readonly baseDir = path.join(process.cwd(), 'uploads');
    private readonly tmpDir = path.join(this.baseDir, '_tmp');

    private async ensureDir(dirPath: string): Promise<void> {
        await fsp.mkdir(dirPath, { recursive: true });
    }

    private safeName(name: string): string {
        const ext = path.extname(name) || '';
        const base = path.basename(name, ext).replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 80);
        return `${base}${ext}`;
    }

    private async writeFileAtomic(filePath: string, data: Buffer): Promise<void> {
        const tmp = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await fsp.writeFile(tmp, data);
        await fsp.rename(tmp, filePath);
    }

    // Choose a deterministic final path up front using sessionId + sanitized name
    private computeFinalPath(workspaceId: string, sessionIdOrId: string, fileName: string): string {
        const safe = this.safeName(fileName);
        const finalDir = path.join(this.baseDir, workspaceId);
        return path.join(finalDir, `${sessionIdOrId}__${safe}`);
    }

    async initObject(params: InitParams): Promise<{ storageKey: string; uploadToken?: any }> {
        const finalPath = this.computeFinalPath(params.workspaceId, params.sessionId, params.fileName);
        const sessionTmpDir = path.join(this.tmpDir, params.sessionId);

        await this.ensureDir(this.baseDir);
        await this.ensureDir(path.dirname(finalPath));
        await this.ensureDir(sessionTmpDir);

        // Store metadata for finalize
        const metadata = {
            workspaceId: params.workspaceId,
            sessionId: params.sessionId,
            fileName: this.safeName(params.fileName),
            mimeType: params.mimeType,
            finalPath,
        };
        await this.writeFileAtomic(path.join(sessionTmpDir, 'meta.json'), Buffer.from(JSON.stringify(metadata)));

        // Use final absolute path as storageKey (opaque to caller)
        return { storageKey: finalPath };
    }

    async appendChunk(params: AppendParams): Promise<void> {
        // storageKey is final path; extract sessionId dir from meta
        // We derive sessionId from filename prefix "<sessionId>__..." used in computeFinalPath
        const baseName = path.basename(params.storageKey);
        const sessionId = baseName.split('__')[0];
        const sessionTmpDir = path.join(this.tmpDir, sessionId);

        await this.ensureDir(sessionTmpDir);
        const partPath = path.join(sessionTmpDir, `${params.chunkIndex}.part`);
        await this.writeFileAtomic(partPath, params.buffer);
    }

    async finalizeObject(params: FinalizeParams): Promise<{ url?: string | null; size: number }> {
        const finalPath = params.storageKey;
        const baseName = path.basename(finalPath);
        const [sessionId] = baseName.split('__');
        const sessionTmpDir = path.join(this.tmpDir, sessionId);
        const metaPath = path.join(sessionTmpDir, 'meta.json');

        // Load metadata
        const metaRaw = await fsp.readFile(metaPath, 'utf8');
        const meta = JSON.parse(metaRaw) as { workspaceId: string; finalPath: string };
        const workspaceId = meta.workspaceId;

        // Collect parts and sort by index
        const entries = await fsp.readdir(sessionTmpDir);
        const partFiles = entries
            .filter((e) => e.endsWith('.part'))
            .map((e) => ({ idx: parseInt(e.split('.part')[0], 10), path: path.join(sessionTmpDir, e) }))
            .sort((a, b) => a.idx - b.idx);

        // Assemble into final file
        await this.ensureDir(path.dirname(finalPath));
        // Write to temp then rename
        const tmpFinal = `${finalPath}.assembling-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const write = fs.createWriteStream(tmpFinal, { flags: 'w' });

        for (const part of partFiles) {
            const data = await fsp.readFile(part.path);
            write.write(data);
        }
        await new Promise<void>((resolve, reject) => {
            write.end(() => resolve());
            write.on('error', reject);
        });
        await fsp.rename(tmpFinal, finalPath);

        // Cleanup tmp parts
        await Promise.all(partFiles.map((p) => fsp.unlink(p.path).catch(() => void 0)));
        // Keep meta for debugging or remove it; we'll remove entire tmp dir
        await fsp.rm(sessionTmpDir, { recursive: true, force: true }).catch(() => void 0);

        const stat = await fsp.stat(finalPath).catch(() => ({ size: 0 } as fs.Stats));
        const url = `/uploads/${workspaceId}/${path.basename(finalPath)}`;
        return { url, size: stat.size };
    }

    async putObject(params: PutParams): Promise<{ storageKey: string; url?: string | null; size: number }> {
        const finalPath = this.computeFinalPath(params.workspaceId, `${Date.now()}_${Math.random().toString(36).slice(2)}`, params.fileName);
        await this.ensureDir(path.dirname(finalPath));
        await this.writeFileAtomic(finalPath, params.buffer);
        const stat = await fsp.stat(finalPath);
        const url = `/uploads/${params.workspaceId}/${path.basename(finalPath)}`;
        return { storageKey: finalPath, url, size: stat.size };
    }

    async deleteTemp(params: DeleteTempParams): Promise<void> {
        // storageKey is final path; derive session tmp dir from basename
        const baseName = path.basename(params.storageKey);
        const [sessionId] = baseName.split('__');
        const sessionTmpDir = path.join(this.tmpDir, sessionId);
        await fsp.rm(sessionTmpDir, { recursive: true, force: true }).catch(() => void 0);
    }

    async computeObjectHash(params: HashParams): Promise<string> {
        const algo = params.algo || 'sha256';
        const filePath = params.storageKey;
        const exists = await fsp.stat(filePath).then(() => true).catch(() => false);
        if (!exists) return '';
        const hash = createHash(algo);
        await new Promise<void>((resolve, reject) => {
            const rs = fs.createReadStream(filePath);
            rs.on('data', (chunk) => hash.update(chunk));
            rs.on('end', () => resolve());
            rs.on('error', reject);
        });
        return hash.digest('hex');
    }
}