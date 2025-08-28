import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from 'class-validator';

class BatchFileItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    fileName: string;

    @ApiProperty()
    @IsNumber()
    @IsPositive()
    fileSize: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    mimeType: string;

    @ApiPropertyOptional({ enum: ['image', 'file', 'audio', 'video'] })
    @IsOptional()
    @IsEnum(['image', 'file', 'audio', 'video'])
    fileCategory?: 'image' | 'file' | 'audio' | 'video';

    @ApiPropertyOptional({ description: 'Client-provided checksum (hex/base64)' })
    @IsOptional()
    @IsString()
    @MaxLength(512)
    checksum?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(512)
    encryptionIv?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(512)
    encryptionTag?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    keyId?: string;
}

export class CreateBatchUploadDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    workspaceId: string;

    @ApiProperty({ enum: ['visitor', 'agent'] })
    @IsEnum(['visitor', 'agent'])
    uploaderType: 'visitor' | 'agent';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    sessionId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    visitorId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    agentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    roomId?: string;

    @ApiProperty({ type: [BatchFileItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => BatchFileItemDto)
    files: BatchFileItemDto[];
}