import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Public } from '../../common/decorators/public.decorator';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { SecureIdService } from '../../common/services/secure-id.service';
import { UploadsService } from '../services/uploads.service';

import { CreateUploadSessionDto } from '../dtos/uploads/create-upload-session.dto';
import { UploadSessionResponseDto } from '../dtos/uploads/upload-session-response.dto';
import { CreateBatchUploadDto } from '../dtos/uploads/create-batch-upload.dto';
import { BatchUploadResponseDto } from '../dtos/uploads/batch-upload-response.dto';
import { UploadChunkDto } from '../dtos/uploads/upload-chunk.dto';
import { ChunkAckDto } from '../dtos/uploads/chunk-ack.dto';
import { CompleteUploadSessionDto } from '../dtos/uploads/complete-upload-session.dto';
import { UploadCompletedDto } from '../dtos/uploads/upload-completed.dto';
import { UploadStatusDto } from '../dtos/uploads/upload-status.dto';
import { BatchStatusDto } from '../dtos/uploads/batch-status.dto';
import { DirectEncryptedUploadDto } from '../dtos/uploads/direct-encrypted-upload.dto';
import { UploadPolicyResponseDto } from '../dtos/uploads/upload-policy-response.dto';
import { ChunkMapDto } from '../dtos/uploads/chunk-map.dto';
import { CancelUploadDto } from '../dtos/uploads/cancel-upload.dto';

type UploadedChunk = {
    buffer: Buffer;
    size: number;
    mimetype: string;
    originalname: string;
};

type UploadedFileType = {
    buffer: Buffer;
    size: number;
    mimetype: string;
    originalname: string;
};

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024;
const DIRECT_MAX_SIZE = 10 * 1024 * 1024;

@ApiTags('Chat Uploads')
@Controller('chat/uploads')
export class UploadsController {
    constructor(
        private readonly logger: AppLoggerService,
        private readonly secureId: SecureIdService,
        private readonly uploadsService: UploadsService,
    ) { }

    @Public()
    @Get('policy')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get server upload policy (allowed types, limits, chunk size)' })
    @ApiResponse({ status: 200, type: UploadPolicyResponseDto })
    async getPolicy(): Promise<UploadPolicyResponseDto> {
        return this.uploadsService.getPolicy({
            defaultChunkSize: DEFAULT_CHUNK_SIZE,
            directMaxSize: DIRECT_MAX_SIZE,
        });
    }

    @Public()
    @Post('sessions')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create an upload session (single file, client-compressed/encrypted)' })
    @ApiResponse({ status: 201, type: UploadSessionResponseDto })
    async createSession(
        @Body() dto: CreateUploadSessionDto,
        @Headers('x-idempotency-key') idemA?: string,
        @Headers('idempotency-key') idemB?: string,
    ): Promise<UploadSessionResponseDto> {
        if (!dto.fileSize || dto.fileSize <= 0) throw new BadRequestException('Invalid file size');
        const allowed = await this.uploadsService.isMimeAllowed(dto.mimeType, dto.workspaceId);
        if (!allowed) throw new BadRequestException('Unsupported file type');
        return this.uploadsService.createSession(dto, {
            idempotencyKey: idemA || idemB || undefined,
            preferredChunkSize: DEFAULT_CHUNK_SIZE,
        });
    }

    @Public()
    @Post('batches')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a batch upload session (multiple files)' })
    @ApiResponse({ status: 201, type: BatchUploadResponseDto })
    async createBatch(
        @Body() dto: CreateBatchUploadDto,
        @Headers('x-idempotency-key') idemA?: string,
        @Headers('idempotency-key') idemB?: string,
    ): Promise<BatchUploadResponseDto> {
        if (!dto.files?.length) throw new BadRequestException('No files provided');
        for (const f of dto.files) {
            if (!f.fileSize || f.fileSize <= 0) throw new BadRequestException(`Invalid file size: ${f.fileName}`);
            const ok = await this.uploadsService.isMimeAllowed(f.mimeType, dto.workspaceId);
            if (!ok) throw new BadRequestException(`Unsupported file type: ${f.fileName}`);
        }
        return this.uploadsService.createBatch(dto, {
            idempotencyKey: idemA || idemB || undefined,
            preferredChunkSize: DEFAULT_CHUNK_SIZE,
        });
    }

    @Public()
    @Post('sessions/:sessionId/chunks')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upload a file chunk (encrypted by client)' })
    @ApiParam({ name: 'sessionId', required: true })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                chunkIndex: { type: 'number' },
                totalChunks: { type: 'number' },
                chunkChecksum: { type: 'string' },
                encryptionIv: { type: 'string' },
                encryptionTag: { type: 'string' },
                keyId: { type: 'string' },
                chunk: { type: 'string', format: 'binary' },
            },
            required: ['chunkIndex', 'totalChunks', 'chunk'],
        },
    })
    @UseInterceptors(
        FileInterceptor('chunk', {
            storage: memoryStorage(),
            limits: { fileSize: DEFAULT_CHUNK_SIZE + 1024 },
        }),
    )
    async uploadChunk(
        @Param('sessionId') sessionId: string,
        @Body() dto: UploadChunkDto,
        @UploadedFile() chunk: UploadedChunk,
        @Headers('x-chunk-idempotency-key') idemA?: string,
        @Headers('x-idempotency-key') idemB?: string,
    ): Promise<ChunkAckDto> {
        if (!chunk?.buffer?.length) throw new BadRequestException('Chunk is required');
        if (dto.chunkIndex < 0 || dto.totalChunks <= 0 || dto.chunkIndex >= dto.totalChunks) {
            throw new BadRequestException('Invalid chunk index or totalChunks');
        }
        return this.uploadsService.acceptChunk(sessionId, dto, chunk.buffer, {
            idempotencyKey: idemA || idemB || undefined,
            reportedMime: chunk.mimetype,
        });
    }

    @Public()
    @Post('sessions/:sessionId/complete')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Complete an upload session and enqueue processing' })
    @ApiParam({ name: 'sessionId', required: true })
    @ApiResponse({ status: 201, type: UploadCompletedDto })
    async complete(
        @Param('sessionId') sessionId: string,
        @Body() dto: CompleteUploadSessionDto,
    ): Promise<UploadCompletedDto> {
        return this.uploadsService.complete(sessionId, dto);
    }

    @Public()
    @Get('sessions/:sessionId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get upload session status (uploading, processing, completed, failed)' })
    @ApiParam({ name: 'sessionId', required: true })
    @ApiResponse({ status: 200, type: UploadStatusDto })
    async getStatus(@Param('sessionId') sessionId: string): Promise<UploadStatusDto> {
        return this.uploadsService.getStatus(sessionId);
    }

    @Public()
    @Get('sessions/:sessionId/chunks')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get uploaded chunk map for resume' })
    @ApiParam({ name: 'sessionId', required: true })
    @ApiResponse({ status: 200, type: ChunkMapDto })
    async getChunkMap(@Param('sessionId') sessionId: string): Promise<ChunkMapDto> {
        return this.uploadsService.getChunkMap(sessionId);
    }

    @Public()
    @Delete('sessions/:sessionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cancel an upload session and cleanup' })
    @ApiParam({ name: 'sessionId', required: true })
    async cancel(
        @Param('sessionId') sessionId: string,
        @Body() dto: CancelUploadDto,
    ): Promise<void> {
        await this.uploadsService.cancel(sessionId, dto);
    }

    @Public()
    @Post('direct')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Direct encrypted upload (small files, client-side compression/encryption)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                workspaceId: { type: 'string' },
                uploaderType: { type: 'string', enum: ['visitor', 'agent'] },
                sessionId: { type: 'string' },
                visitorId: { type: 'string' },
                agentId: { type: 'string' },
                roomId: { type: 'string' },
                fileName: { type: 'string' },
                mimeType: { type: 'string' },
                encryptionIv: { type: 'string' },
                encryptionTag: { type: 'string' },
                keyId: { type: 'string' },
                checksum: { type: 'string' },
            },
            required: ['file', 'workspaceId', 'uploaderType', 'fileName', 'mimeType'],
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: DIRECT_MAX_SIZE },
        }),
    )
    async direct(
        @UploadedFile() file: UploadedFileType,
        @Body() dto: DirectEncryptedUploadDto,
        @Headers('x-idempotency-key') idemA?: string,
        @Headers('idempotency-key') idemB?: string,
    ): Promise<UploadCompletedDto> {
        if (!file) throw new BadRequestException('File is required');
        const allowed = await this.uploadsService.isMimeAllowed(dto.mimeType, dto.workspaceId);
        if (!allowed) throw new BadRequestException('Unsupported file type');
        return this.uploadsService.acceptDirect({
            buffer: file.buffer,
            size: file.size,
            fileName: dto.fileName,
            mimeType: dto.mimeType,
            workspaceId: dto.workspaceId,
            uploaderType: dto.uploaderType,
            sessionId: dto.sessionId,
            visitorId: dto.visitorId,
            agentId: dto.agentId,
            roomId: dto.roomId,
            encryptionIv: dto.encryptionIv,
            encryptionTag: dto.encryptionTag,
            keyId: dto.keyId,
            checksum: dto.checksum,
            idempotencyKey: idemA || idemB || undefined,
        });
    }

    @Public()
    @Get('batches/:batchId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get batch status and optional item details' })
    @ApiParam({ name: 'batchId', required: true })
    @ApiQuery({ name: 'includeItems', required: false, type: Boolean })
    @ApiResponse({ status: 200, type: BatchStatusDto })
    async getBatchStatus(
        @Param('batchId') batchId: string,
        @Query('includeItems') includeItems?: string,
    ): Promise<BatchStatusDto> {
        return this.uploadsService.getBatchStatus(batchId, { includeItems: includeItems === 'true' });
    }
}