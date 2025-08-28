import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { createHash } from 'crypto';
import {
    CreateUploadSessionDto,
} from '../dtos/uploads/create-upload-session.dto';
import { UploadSessionResponseDto } from '../dtos/uploads/upload-session-response.dto';
import { CreateBatchUploadDto } from '../dtos/uploads/create-batch-upload.dto';
import { BatchUploadResponseDto } from '../dtos/uploads/batch-upload-response.dto';
import { UploadChunkDto } from '../dtos/uploads/upload-chunk.dto';
import { ChunkAckDto } from '../dtos/uploads/chunk-ack.dto';
import { CompleteUploadSessionDto } from '../dtos/uploads/complete-upload-session.dto';
import { UploadCompletedDto } from '../dtos/uploads/upload-completed.dto';
import { UploadStatusDto } from '../dtos/uploads/upload-status.dto';
import { BatchStatusDto } from '../dtos/uploads/batch-status.dto';
import { UploadPolicyResponseDto } from '../dtos/uploads/upload-policy-response.dto';
import { ChunkMapDto } from '../dtos/uploads/chunk-map.dto';
import { CancelUploadDto } from '../dtos/uploads/cancel-upload.dto';

export interface StorageAdapter {
    // For chunked: optionally use multipart upload upstream (S3 MPU) instead of local temp
    initObject(params: { workspaceId: string; sessionId: string; fileName: string; mimeType: string }): Promise<{ storageKey: string; uploadToken?: any }>;
    appendChunk(params: { storageKey: string; chunkIndex: number; buffer: Buffer }): Promise<void>;
    finalizeObject(params: { storageKey: string }): Promise<{ url?: string | null; size: number }>;
    putObject(params: { workspaceId: string; fileName: string; mimeType: string; buffer: Buffer }): Promise<{ storageKey: string; url?: string | null; size: number }>;
    deleteTemp?(params: { storageKey: string }): Promise<void>;
    computeObjectHash?(params: { storageKey: string; algo?: 'sha256' | 'sha1' }): Promise<string>;
}

type SessionState = {
    sessionId: string;
    workspaceId: string;
    uploaderType: 'visitor' | 'agent';
    fileName: string;
    fileSize: number;
    mimeType: string;
    totalChunks: number;
    uploadedChunks: number;
    status: 'initiated' | 'uploading' | 'processing' | 'completed' | 'failed' | 'canceled';
    roomId?: string | null;
    storageKey: string;
    encryption?: {
        keyAlgorithm?: string;        // e.g., 'RSA-OAEP-256'
        contentAlgorithm?: string;    // e.g., 'AES-256-GCM'
        keyId?: string;
        encryptedKey?: string;        // base64
        iv?: string;                  // base64
        authTag?: string;             // base64
        ciphertextHash?: string;      // hex or base64
    };
};

type UploadProgressState = {
    uploadedChunks: number;
    totalChunks: number;
    status: 'initiated' | 'uploading' | 'processing' | 'completed' | 'failed' | 'canceled';
};

@Injectable()
export class UploadsService {
    private readonly REDIS_KEYS = {
        SESSION: (sid: string) => `upload:session:${sid}`,
        STATE: (sid: string) => `upload:state:${sid}`,            // JSON: {status, uploadedChunks, totalChunks, ...}
        CHUNKMAP: (sid: string) => `upload:chunks:${sid}`,         // set of received indices
        BATCH: (bid: string) => `upload:batch:${bid}`,
        IDEMPOTENCY: (key: string) => `idem:${key}`,
    };
    private readonly TTL = {
        SESSION: 24 * 60 * 60,
        IDEM: 6 * 60 * 60,
    };
    private readonly DEFAULTS = {
        chunkSize: 2 * 1024 * 1024,
        directMaxSize: 10 * 1024 * 1024, // 10MB per file (Zendesk/Zopim chat)
    };

    // Per-type caps (bytes) - aligned to 10MB chat limit
    private readonly PER_TYPE_MAX = {
        image: 10 * 1024 * 1024,
        audio: 10 * 1024 * 1024,
        video: 10 * 1024 * 1024,
        file: 10 * 1024 * 1024,
    };

    constructor(
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        @Inject('FILE_PROCESSING_QUEUE') private readonly fileQueue: Queue,
        @Inject('STORAGE_ADAPTER') private readonly storage: StorageAdapter,
        private readonly logger: AppLoggerService,
    ) { }

    // Policy exposed to controller; allow per-workspace overrides internally
    async getPolicy(input: { defaultChunkSize: number; directMaxSize: number }): Promise<UploadPolicyResponseDto> {
        return {
            allowedMimeExact: [
                'application/pdf', 'text/plain', 'text/markdown',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/csv', 'application/csv', 'application/rtf', 'application/json', 'application/xml',
                'application/vnd.oasis.opendocument.text',
                'application/vnd.oasis.opendocument.spreadsheet',
                'application/vnd.oasis.opendocument.presentation',
                'image/svg+xml', 'image/heic',
            ],
            allowedMimePrefixes: ['image/', 'audio/', 'video/'],
            denyExact: ['application/x-msdownload', 'application/x-dosexec', 'application/x-sh', 'application/x-executable'],
            defaultChunkSize: input.defaultChunkSize || this.DEFAULTS.chunkSize,
            directMaxSize: input.directMaxSize || this.DEFAULTS.directMaxSize,
            enableArchives: false,
        };
    }

    async isMimeAllowed(mime: string, _workspaceId?: string): Promise<boolean> {
        if (!mime) return false;
        const policy = await this.getPolicy({ defaultChunkSize: this.DEFAULTS.chunkSize, directMaxSize: this.DEFAULTS.directMaxSize });
        if (policy.denyExact?.includes(mime)) return false;
        if (policy.allowedMimeExact.includes(mime)) return true;
        return policy.allowedMimePrefixes.some(p => mime.startsWith(p));
    }

    private resolveCategory(input?: 'image' | 'audio' | 'video' | 'file', mime?: string): 'image' | 'audio' | 'video' | 'file' {
        if (input) return input;
        if (mime?.startsWith('image/')) return 'image';
        if (mime?.startsWith('audio/')) return 'audio';
        if (mime?.startsWith('video/')) return 'video';
        return 'file';
    }

    private maxBytesFor(category: 'image' | 'audio' | 'video' | 'file'): number {
        return this.PER_TYPE_MAX[category] ?? this.PER_TYPE_MAX.file;
    }

    async createSession(dto: CreateUploadSessionDto, opts: { idempotencyKey?: string; preferredChunkSize?: number }): Promise<UploadSessionResponseDto> {
        if (opts.idempotencyKey) {
            const ok = await this.redis.set(this.REDIS_KEYS.IDEMPOTENCY(opts.idempotencyKey), '1', 'EX', this.TTL.IDEM, 'NX');
            if (!ok) throw new BadRequestException('Duplicate request');
        }
        const sessionId = `upl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const chunkSize = opts.preferredChunkSize || this.DEFAULTS.chunkSize;
        const totalChunks = Math.max(1, Math.ceil(dto.fileSize / chunkSize));

        // Size validation against per-type caps
        const category = this.resolveCategory(dto.fileCategory, dto.mimeType);
        const maxAllowed = this.maxBytesFor(category);
        if (!dto.fileSize || dto.fileSize <= 0) {
            throw new BadRequestException('Invalid file size');
        }
        if (dto.fileSize > maxAllowed) {
            throw new BadRequestException(`File too large for category ${category}. Max ${maxAllowed} bytes`);
        }

        // Prepare storage (obtain storageKey)
        const initRes = await this.storage.initObject({ workspaceId: dto.workspaceId, sessionId, fileName: dto.fileName, mimeType: dto.mimeType });
        const storageKey = initRes.storageKey || sessionId;

        const state: SessionState = {
            sessionId,
            workspaceId: dto.workspaceId,
            uploaderType: dto.uploaderType,
            fileName: dto.fileName,
            fileSize: dto.fileSize,
            mimeType: dto.mimeType,
            totalChunks,
            uploadedChunks: 0,
            status: 'initiated',
            roomId: dto.roomId || null,
            storageKey,
            encryption: dto.encryptedKey || dto.keyAlgorithm || dto.contentAlgorithm || dto.ciphertextHash || dto.encryptionIv || dto.encryptionTag || dto.keyId
                ? {
                    keyAlgorithm: dto.keyAlgorithm,
                    contentAlgorithm: dto.contentAlgorithm,
                    keyId: dto.keyId,
                    encryptedKey: dto.encryptedKey,
                    iv: dto.encryptionIv,
                    authTag: dto.encryptionTag,
                    ciphertextHash: dto.ciphertextHash,
                }
                : undefined,
        };

        await this.redis.multi()
            .setex(this.REDIS_KEYS.SESSION(sessionId), this.TTL.SESSION, JSON.stringify(state))
            .setex(this.REDIS_KEYS.STATE(sessionId), this.TTL.SESSION, JSON.stringify({ uploadedChunks: 0, totalChunks, status: 'initiated' } satisfies UploadProgressState))
            .del(this.REDIS_KEYS.CHUNKMAP(sessionId))
            .exec();

        return {
            sessionId,
            workspaceId: dto.workspaceId,
            uploaderType: dto.uploaderType,
            fileName: dto.fileName,
            fileSize: dto.fileSize,
            mimeType: dto.mimeType,
            chunkSize,
            totalChunks,
            status: 'initiated',
            expiresAt: new Date(Date.now() + this.TTL.SESSION * 1000).toISOString(),
        };
    }

    async createBatch(dto: CreateBatchUploadDto, opts: { idempotencyKey?: string; preferredChunkSize?: number }): Promise<BatchUploadResponseDto> {
        const batchId = `ub_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // Enforce max 5 files per batch
        if (!dto.files?.length) throw new BadRequestException('No files provided');
        if (dto.files.length > 5) throw new BadRequestException('Maximum of 5 files allowed per batch');

        const items: BatchUploadResponseDto['items'] = [];
        for (const f of dto.files) {
            // Per-item size validation against per-type caps
            const category = this.resolveCategory(f.fileCategory, f.mimeType);
            const maxAllowed = this.maxBytesFor(category);
            if (!f.fileSize || f.fileSize <= 0) throw new BadRequestException(`Invalid file size: ${f.fileName}`);
            if (f.fileSize > maxAllowed) throw new BadRequestException(`File too large for ${f.fileName}. Max ${maxAllowed} bytes for ${category}`);

            const single = await this.createSession({
                workspaceId: dto.workspaceId,
                uploaderType: dto.uploaderType,
                sessionId: dto.sessionId,
                visitorId: dto.visitorId,
                agentId: dto.agentId,
                roomId: dto.roomId,
                fileName: f.fileName,
                fileSize: f.fileSize,
                mimeType: f.mimeType,
                fileCategory: f.fileCategory,
                encryptionIv: f.encryptionIv,
                encryptionTag: f.encryptionTag,
                keyId: f.keyId,
            }, { preferredChunkSize: opts.preferredChunkSize, idempotencyKey: undefined });
            items.push({
                sessionId: single.sessionId,
                fileName: single.fileName,
                fileSize: single.fileSize,
                mimeType: single.mimeType,
                chunkSize: single.chunkSize,
                totalChunks: single.totalChunks,
                status: single.status,
            });
        }
        await this.redis.setex(this.REDIS_KEYS.BATCH(batchId), this.TTL.SESSION, JSON.stringify({ batchId, items: items.map(i => i.sessionId) }));
        return { batchId, items, defaultChunkSize: opts.preferredChunkSize || this.DEFAULTS.chunkSize };
    }

    async acceptChunk(sessionId: string, dto: UploadChunkDto, buffer: Buffer, opts: { idempotencyKey?: string; reportedMime?: string }): Promise<ChunkAckDto> {
        // Load session to get storageKey and totalChunks
        const raw = await this.redis.get(this.REDIS_KEYS.SESSION(sessionId));
        if (!raw) throw new BadRequestException('Invalid session');
        const session = JSON.parse(raw) as SessionState;

        // Idempotency: if duplicate, return current state rather than rejecting
        if (opts.idempotencyKey) {
            const ok = await this.redis.set(this.REDIS_KEYS.IDEMPOTENCY(opts.idempotencyKey), '1', 'EX', this.TTL.IDEM, 'NX');
            if (!ok) {
                const stateRaw = await this.redis.get(this.REDIS_KEYS.STATE(sessionId));
                const state = stateRaw ? (JSON.parse(stateRaw) as UploadProgressState) : { uploadedChunks: 0, totalChunks: session.totalChunks, status: 'uploading' as const };
                return {
                    sessionId,
                    chunkIndex: dto.chunkIndex,
                    received: true,
                    uploadedChunks: state.uploadedChunks,
                    totalChunks: state.totalChunks,
                    nextChunkIndex: state.uploadedChunks < state.totalChunks ? state.uploadedChunks : undefined,
                    status: 'uploading',
                };
            }
        }

        // Integrity: verify chunk checksum if provided (checksum over ciphertext)
        if (dto.chunkChecksum) {
            const hashHex = createHash('sha256').update(buffer).digest('hex');
            const hashB64 = createHash('sha256').update(buffer).digest('base64');

            const provided = dto.chunkChecksum.trim();
            const matches = provided.toLowerCase() === hashHex || provided === hashB64;

            if (!matches) {
                throw new BadRequestException('Chunk checksum mismatch');
            }
        }

        await this.storage.appendChunk({ storageKey: session.storageKey, chunkIndex: dto.chunkIndex, buffer });
        await this.redis.sadd(this.REDIS_KEYS.CHUNKMAP(sessionId), String(dto.chunkIndex));

        const uploaded = await this.redis.scard(this.REDIS_KEYS.CHUNKMAP(sessionId));
        const totalChunks = session.totalChunks;

        await this.redis.setex(this.REDIS_KEYS.STATE(sessionId), this.TTL.SESSION, JSON.stringify({ uploadedChunks: uploaded, totalChunks, status: 'uploading' } satisfies UploadProgressState));

        return {
            sessionId,
            chunkIndex: dto.chunkIndex,
            received: true,
            uploadedChunks: uploaded,
            totalChunks,
            nextChunkIndex: uploaded < totalChunks ? uploaded : undefined,
            status: 'uploading',
        };
    }

    async complete(sessionId: string, dto: CompleteUploadSessionDto): Promise<UploadCompletedDto> {
        const raw = await this.redis.get(this.REDIS_KEYS.SESSION(sessionId));
        if (!raw) throw new BadRequestException('Invalid session');
        const session = JSON.parse(raw) as SessionState;

        const mapCount = await this.redis.scard(this.REDIS_KEYS.CHUNKMAP(sessionId));
        const expectedChunks = dto.totalChunks ?? session.totalChunks;
        if (mapCount !== expectedChunks) {
            throw new BadRequestException('Missing chunks');
        }

        // Finalize store
        const finalized = await this.storage.finalizeObject({ storageKey: session.storageKey });

        // Integrity: verify final ciphertext hash if we have expected hash and adapter supports hashing
        if (session.encryption?.ciphertextHash && this.storage.computeObjectHash) {
            const got = await this.storage.computeObjectHash({ storageKey: session.storageKey, algo: 'sha256' });
            if (got && got !== session.encryption.ciphertextHash) {
                throw new BadRequestException('File integrity check failed');
            }
        }

        const job = await this.fileQueue.add('post-process', {
            sessionId,
            workspaceId: session.workspaceId,
            storageKey: session.storageKey,
            fileName: session.fileName,
            mimeType: dto?.mimeType || session.mimeType,
            size: finalized.size,
            checksum: dto?.finalChecksum, // optional legacy field
            encryption: session.encryption || null,
        }, { priority: 3 });

        await this.redis.setex(this.REDIS_KEYS.STATE(sessionId), this.TTL.SESSION, JSON.stringify({
            uploadedChunks: mapCount,
            totalChunks: session.totalChunks,
            status: 'processing',
        } satisfies UploadProgressState));

        return {
            sessionId,
            uploadId: sessionId,
            storageKey: session.storageKey,
            fileName: session.fileName,
            mimeType: dto?.mimeType || session.mimeType,
            size: finalized.size,
            status: 'processing',
            url: finalized.url ?? null,
            previewUrl: null,
            processingJobId: job.id as string,
            encryption: session.encryption || undefined,
        };
    }

    async getStatus(sessionId: string): Promise<UploadStatusDto> {
        const [rawSession, rawState] = await this.redis.mget(this.REDIS_KEYS.SESSION(sessionId), this.REDIS_KEYS.STATE(sessionId));
        if (!rawSession || !rawState) throw new BadRequestException('Invalid session');
        const session = JSON.parse(rawSession) as SessionState;
        const state = JSON.parse(rawState) as UploadProgressState;
        const progress = Math.min(100, Math.floor((state.uploadedChunks / state.totalChunks) * 100));
        return {
            sessionId,
            status: state.status,
            uploadedChunks: state.uploadedChunks,
            totalChunks: state.totalChunks,
            progress,
            file: { fileName: session.fileName, mimeType: session.mimeType, size: session.fileSize },
            result: undefined,
        };
    }

    async getChunkMap(sessionId: string): Promise<ChunkMapDto> {
        const rawSession = await this.redis.get(this.REDIS_KEYS.SESSION(sessionId));
        if (!rawSession) throw new BadRequestException('Invalid session');
        const session = JSON.parse(rawSession) as SessionState;
        const members = await this.redis.smembers(this.REDIS_KEYS.CHUNKMAP(sessionId));
        const indices = members.map(m => parseInt(m, 10)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
        return {
            sessionId,
            totalChunks: session.totalChunks,
            chunkSize: Math.ceil(session.fileSize / session.totalChunks),
            receivedIndices: indices,
            uploadedCount: indices.length,
        };
    }

    async cancel(sessionId: string, dto: CancelUploadDto): Promise<void> {
        // Load session to get storageKey for cleanup
        const raw = await this.redis.get(this.REDIS_KEYS.SESSION(sessionId));
        const session = raw ? (JSON.parse(raw) as Partial<SessionState>) : null;

        await this.redis.multi()
            .del(this.REDIS_KEYS.SESSION(sessionId))
            .del(this.REDIS_KEYS.STATE(sessionId))
            .del(this.REDIS_KEYS.CHUNKMAP(sessionId))
            .exec();

        if (dto?.deleteUploadedChunks && session?.storageKey) {
            await this.storage.deleteTemp?.({ storageKey: session.storageKey });
        }
    }

    async acceptDirect(input: {
        buffer: Buffer; size: number; fileName: string; mimeType: string;
        workspaceId: string; uploaderType: 'visitor' | 'agent'; sessionId?: string; visitorId?: string; agentId?: string; roomId?: string;
        encryptionIv?: string; encryptionTag?: string; keyId?: string; checksum?: string; idempotencyKey?: string;
        keyAlgorithm?: string; contentAlgorithm?: string; encryptedKey?: string; ciphertextHash?: string;
    }): Promise<UploadCompletedDto> {
        if (input.idempotencyKey) {
            const ok = await this.redis.set(this.REDIS_KEYS.IDEMPOTENCY(input.idempotencyKey), '1', 'EX', this.TTL.IDEM, 'NX');
            if (!ok) throw new BadRequestException('Duplicate request');
        }

        // Enforce direct route cap (smaller) AND per-type cap
        const category = this.resolveCategory(undefined, input.mimeType);
        const perTypeCap = this.maxBytesFor(category);
        const directCap = this.DEFAULTS.directMaxSize;
        const maxAllowed = Math.min(perTypeCap, directCap);
        if (!input.size || input.size <= 0) throw new BadRequestException('Invalid file size');
        if (input.size > maxAllowed) {
            throw new BadRequestException(`File too large for direct upload. Max ${maxAllowed} bytes for ${category}`);
        }

        const put = await this.storage.putObject({
            workspaceId: input.workspaceId,
            fileName: input.fileName,
            mimeType: input.mimeType,
            buffer: input.buffer,
        });
        // Optional integrity check for direct upload (if adapter can hash and client provided expected hash)
        if (input.ciphertextHash && this.storage.computeObjectHash) {
            const got = await this.storage.computeObjectHash({ storageKey: put.storageKey, algo: 'sha256' });
            if (got && got !== input.ciphertextHash) {
                throw new BadRequestException('File integrity check failed');
            }
        }
        const job = await this.fileQueue.add('post-process', {
            sessionId: null,
            workspaceId: input.workspaceId,
            storageKey: put.storageKey,
            fileName: input.fileName,
            mimeType: input.mimeType,
            size: put.size,
            checksum: input.checksum,
            encryption: {
                keyAlgorithm: input.keyAlgorithm,
                contentAlgorithm: input.contentAlgorithm,
                keyId: input.keyId,
                encryptedKey: input.encryptedKey,
                iv: input.encryptionIv,
                authTag: input.encryptionTag,
                ciphertextHash: input.ciphertextHash,
            },
        }, { priority: 3 });

        return {
            sessionId: '',
            uploadId: put.storageKey,
            storageKey: put.storageKey,
            fileName: input.fileName,
            mimeType: input.mimeType,
            size: put.size,
            status: 'processing',
            url: put.url ?? null,
            previewUrl: null,
            processingJobId: job.id as string,
            encryption: {
                keyAlgorithm: input.keyAlgorithm,
                contentAlgorithm: input.contentAlgorithm,
                keyId: input.keyId,
                encryptedKey: input.encryptedKey,
                iv: input.encryptionIv,
                authTag: input.encryptionTag,
                ciphertextHash: input.ciphertextHash,
            },
        };
    }

    async getBatchStatus(batchId: string, opts: { includeItems?: boolean }): Promise<BatchStatusDto> {
        const raw = await this.redis.get(this.REDIS_KEYS.BATCH(batchId));
        if (!raw) throw new BadRequestException('Invalid batch');
        const data = JSON.parse(raw) as { batchId: string; items: string[] };
        const items: BatchStatusDto['items'] = [];

        let allCompleted = true;
        let anyFailed = false;

        for (const sid of data.items) {
            const [stateRaw, sessRaw] = await this.redis.mget(this.REDIS_KEYS.STATE(sid), this.REDIS_KEYS.SESSION(sid));
            if (!stateRaw || !sessRaw) continue;
            const state = JSON.parse(stateRaw) as UploadProgressState;
            const sess = JSON.parse(sessRaw) as SessionState;

            items.push({
                sessionId: sid,
                status: state.status,
                uploadedChunks: state.uploadedChunks,
                totalChunks: state.totalChunks,
                progress: Math.floor((state.uploadedChunks / state.totalChunks) * 100),
                fileName: sess.fileName,
                mimeType: sess.mimeType,
                size: sess.fileSize,
            });

            if (state.status !== 'completed') allCompleted = false;
            if (state.status === 'failed') anyFailed = true;
        }

        return {
            batchId,
            status: allCompleted ? 'completed' : anyFailed ? 'partial' : 'uploading',
            items: opts?.includeItems ? items : [],
        };
    }
}