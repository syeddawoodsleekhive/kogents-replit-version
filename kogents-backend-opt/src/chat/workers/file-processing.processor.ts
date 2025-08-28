import { Injectable } from '@nestjs/common';
import { Worker } from 'bullmq';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { promises as fsp } from 'fs';

type EncryptionInfo = {
    keyAlgorithm?: string;
    contentAlgorithm?: string;
    keyId?: string;
    encryptedKey?: string;
    iv?: string;
    authTag?: string;
    ciphertextHash?: string;
};

type FileProcessJob = {
    sessionId?: string | null;
    workspaceId: string;
    storageKey: string; // absolute path (LocalStorageAdapter)
    fileName: string;
    mimeType: string;
    size: number;
    checksum?: string | null;
    encryption?: EncryptionInfo | null;
};

type UploadProgressState = {
    uploadedChunks: number;
    totalChunks: number;
    status: 'initiated' | 'uploading' | 'processing' | 'completed' | 'failed' | 'canceled';
};

@Injectable()
export class FileProcessingProcessor {
    private readonly QUEUE_NAME = 'file-processing';

    constructor(
        private readonly logger: AppLoggerService,
        private readonly redis: Redis,
    ) { }

    createWorker(): Worker {
        return new Worker(this.QUEUE_NAME, async (job) => {
            const data = job.data as FileProcessJob;
            this.logger.log(`Processing file job ${job.id} for ${data.fileName}`, 'FileProcessingProcessor');

            try {
                // Validate file exists
                const exists = await fsp.stat(data.storageKey).then(() => true).catch(() => false);
                if (!exists) {
                    throw new Error('File not found on storage');
                }

                // If a session exists, mark it completed in Redis state
                if (data.sessionId) {
                    const stateKey = `upload:state:${data.sessionId}`;
                    const rawState = await this.redis.get(stateKey);
                    if (rawState) {
                        const state = JSON.parse(rawState) as UploadProgressState;
                        const ttl = await this.redis.ttl(stateKey);
                        state.status = 'completed';
                        await this.redis.set(stateKey, JSON.stringify(state));
                        if (ttl > 0) await this.redis.expire(stateKey, ttl);
                    }
                }

                await job.updateProgress(100);
                this.logger.log(`File job ${job.id} completed for ${data.fileName}`, 'FileProcessingProcessor');
                return { ok: true };
            } catch (err: any) {
                this.logger.error(`File job ${job.id} failed: ${err?.message || err}`, 'FileProcessingProcessor');
                throw err;
            }
        }, {
            connection: this.redis,
        });
    }
}