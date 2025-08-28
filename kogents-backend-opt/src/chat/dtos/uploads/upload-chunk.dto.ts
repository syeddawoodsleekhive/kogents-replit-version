import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadChunkDto {
    @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) chunkIndex: number;
    @ApiProperty() @Type(() => Number) @IsNumber() @Min(1) totalChunks: number;

    // Integrity: SHA-256 of this encrypted chunk (hex)
    @ApiPropertyOptional() @IsOptional() @IsString() chunkChecksum?: string;

    // Encryption transport metadata (optional)
    @ApiPropertyOptional() @IsOptional() @IsString() encryptionIv?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() encryptionTag?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() keyId?: string;
}