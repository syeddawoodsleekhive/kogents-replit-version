import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadSessionResponseDto {
    @ApiProperty()
    sessionId: string;

    @ApiProperty()
    workspaceId: string;

    @ApiProperty({ enum: ['visitor', 'agent'] })
    uploaderType: 'visitor' | 'agent';

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

    @ApiProperty({ enum: ['initiated', 'uploading'] })
    status: 'initiated' | 'uploading';

    @ApiProperty()
    expiresAt: string;

    @ApiPropertyOptional()
    batchId?: string;
}