import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelUploadDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;

    @ApiPropertyOptional({ description: 'Whether to delete uploaded chunks from temporary storage' })
    @IsOptional()
    @IsBoolean()
    deleteUploadedChunks?: boolean;
}