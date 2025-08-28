import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UploadFileInfoDto {
    @ApiProperty()
    fileName: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    size: number;
}

class UploadResultInfoDto {
    @ApiProperty()
    uploadId: string;

    @ApiProperty()
    storageKey: string;

    @ApiPropertyOptional()
    url?: string | null;

    @ApiPropertyOptional()
    previewUrl?: string | null;
}

export class UploadStatusDto {
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

    @ApiProperty({ type: UploadFileInfoDto })
    file: UploadFileInfoDto;

    @ApiPropertyOptional()
    errorCode?: string;

    @ApiPropertyOptional()
    errorMessage?: string;

    @ApiPropertyOptional({ type: UploadResultInfoDto })
    result?: UploadResultInfoDto;
}