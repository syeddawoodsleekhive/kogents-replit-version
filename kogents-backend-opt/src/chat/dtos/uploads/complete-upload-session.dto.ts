import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsNumber, Min } from 'class-validator';

export class CompleteUploadSessionDto {
    // Optional legacy checksum
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(512) finalChecksum?: string;

    @ApiPropertyOptional({ description: 'Total chunks client expected (server will verify)' })
    @IsOptional() @IsNumber() @Min(1)
    totalChunks?: number;

    // If MIME changed post-compression
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) mimeType?: string;

    // Integrity: SHA-256 of final ciphertext
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(128) ciphertextHash?: string;
}