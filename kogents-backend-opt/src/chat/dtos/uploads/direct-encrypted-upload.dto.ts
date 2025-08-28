import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class DirectEncryptedUploadDto {
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) workspaceId: string;
    @ApiProperty({ enum: ['visitor', 'agent'] }) @IsEnum(['visitor', 'agent']) uploaderType: 'visitor' | 'agent';
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) sessionId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) visitorId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) agentId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) roomId?: string;
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) fileName: string;
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(150) mimeType: string;

    // Encryption metadata
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) keyAlgorithm?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) contentAlgorithm?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) keyId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() encryptedKey?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() encryptionIv?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() encryptionTag?: string;
    @ApiPropertyOptional({ description: 'SHA-256 of final ciphertext (hex)' }) @IsOptional() @IsString() @MaxLength(128) ciphertextHash?: string;

    // Optional legacy checksum
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(512) checksum?: string;
}