import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsPositive, MaxLength } from 'class-validator';

export class CreateUploadSessionDto {
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) workspaceId: string;
    @ApiProperty({ enum: ['visitor', 'agent'] }) @IsEnum(['visitor', 'agent']) uploaderType: 'visitor' | 'agent';
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) sessionId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) visitorId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) agentId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) roomId?: string;
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) fileName: string;
    @ApiProperty() @IsNumber() @IsPositive() fileSize: number;
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(150) mimeType: string;
    @ApiPropertyOptional({ enum: ['image', 'file', 'audio', 'video'] }) @IsOptional() @IsEnum(['image', 'file', 'audio', 'video']) fileCategory?: 'image' | 'file' | 'audio' | 'video';

    // Encryption metadata (client-side E2E)
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) keyAlgorithm?: string;       // e.g., RSA-OAEP-256
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) contentAlgorithm?: string;   // e.g., AES-256-GCM
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) keyId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() encryptedKey?: string;                      // base64
    @ApiPropertyOptional() @IsOptional() @IsString() encryptionIv?: string;                      // base64
    @ApiPropertyOptional() @IsOptional() @IsString() encryptionTag?: string;                     // base64
    @ApiPropertyOptional({ description: 'SHA-256 of final ciphertext (hex)' }) @IsOptional() @IsString() @MaxLength(128) ciphertextHash?: string;
}