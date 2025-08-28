// src/canned-responses/dtos/update-canned-response.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ArrayMaxSize, IsBoolean } from 'class-validator';

export class UpdateCannedResponseDto {
    @ApiPropertyOptional({ description: 'Title of the canned response' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: 'Content/body of the canned response' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ description: 'Optional keyboard shortcut' })
    @IsOptional()
    @IsString()
    shortcut?: string;

    @ApiPropertyOptional({ description: 'Optional category id' })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ type: [String], description: 'Optional tags' })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    tags?: string[];

    @ApiPropertyOptional({ description: 'Set active status' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Optional folder id if using folders' })
    @IsOptional()
    @IsString()
    cannedResponseFolderId?: string;
}