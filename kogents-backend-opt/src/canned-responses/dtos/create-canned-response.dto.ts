import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayMaxSize, IsBoolean } from 'class-validator';

export class CreateCannedResponseDto {
    @ApiProperty({ description: 'Title of the canned response' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Content/body of the canned response' })
    @IsString()
    content: string;

    @ApiPropertyOptional({ description: 'Optional keyboard shortcut' })
    @IsOptional()
    @IsString()
    shortcut?: string;

    @ApiPropertyOptional({ description: 'Optional category id' })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ type: [String], description: 'Optional tags', default: [] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    tags?: string[];

    @ApiPropertyOptional({ description: 'Set active status', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Optional folder id if using folders' })
    @IsOptional()
    @IsString()
    cannedResponseFolderId?: string;
}