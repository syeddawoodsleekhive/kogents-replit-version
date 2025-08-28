import { ApiProperty } from '@nestjs/swagger';

class BatchItemSessionDto {
    @ApiProperty()
    sessionId: string;

    @ApiProperty()
    fileName: string;

    @ApiProperty()
    fileSize: number;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    chunkSize: number;

    @ApiProperty()
    totalChunks: number;

    @ApiProperty({ enum: ['initiated', 'uploading', 'processing', 'completed', 'failed', 'canceled'] })
    status: 'initiated' | 'uploading' | 'processing' | 'completed' | 'failed' | 'canceled';
}

export class BatchUploadResponseDto {
    @ApiProperty()
    batchId: string;

    @ApiProperty({ type: [BatchItemSessionDto] })
    items: BatchItemSessionDto[];

    @ApiProperty()
    defaultChunkSize: number;
}