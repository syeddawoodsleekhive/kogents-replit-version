import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class EncryptionInfoDto {
    @ApiPropertyOptional() keyAlgorithm?: string;
    @ApiPropertyOptional() contentAlgorithm?: string;
    @ApiPropertyOptional() keyId?: string;
    @ApiPropertyOptional() encryptedKey?: string;
    @ApiPropertyOptional() iv?: string;
    @ApiPropertyOptional() authTag?: string;
    @ApiPropertyOptional() ciphertextHash?: string;
}

export class UploadCompletedDto {
    @ApiProperty() sessionId: string;
    @ApiProperty() uploadId: string;
    @ApiProperty() storageKey: string;
    @ApiProperty() fileName: string;
    @ApiProperty() mimeType: string;
    @ApiProperty() size: number;
    @ApiProperty({ enum: ['processing', 'completed'] }) status: 'processing' | 'completed';
    @ApiPropertyOptional() url?: string | null;
    @ApiPropertyOptional() previewUrl?: string | null;
    @ApiPropertyOptional() width?: number;
    @ApiPropertyOptional() height?: number;
    @ApiPropertyOptional() processingJobId?: string;
    @ApiPropertyOptional({ type: EncryptionInfoDto }) encryption?: EncryptionInfoDto;
}