import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BatchItemStatusDto {
    @ApiProperty()
    sessionId: string;

    @ApiProperty({ enum: ['initiated', 'uploading', 'processing', 'completed', 'failed', 'canceled'] })
    status: 'initiated' | 'uploading' | 'processing' | 'completed' | 'failed' | 'canceled';

    @ApiProperty()
    uploadedChunks: number;

    @ApiProperty()
    totalChunks: number;

    @ApiProperty()
    progress: number;

    @ApiProperty()
    fileName: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    size: number;

    @ApiPropertyOptional()
    errorCode?: string;

    @ApiPropertyOptional()
    errorMessage?: string;
}

export class BatchStatusDto {
    @ApiProperty()
    batchId: string;

    @ApiProperty({ enum: ['uploading', 'processing', 'completed', 'failed', 'partial'] })
    status: 'uploading' | 'processing' | 'completed' | 'failed' | 'partial';

    @ApiProperty({ type: [BatchItemStatusDto] })
    items: BatchItemStatusDto[];
}