import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsArray, ArrayMaxSize } from 'class-validator';
import { CannedResponseCategoryResponseDto } from './canned-response-category-response.dto';
import { CannedResponseFolderResponseDto } from './canned-response-folder-response.dto';

export class ExportCannedResponseDto {
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
    category?: CannedResponseCategoryResponseDto;

    @ApiPropertyOptional({ type: [String], description: 'Optional tags', default: [] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    tags?: string[];

    @ApiPropertyOptional({ description: 'Active status', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Optional folder id if using folders' })
    @IsOptional()
    @IsString()
    cannedResponseFolder?: CannedResponseFolderResponseDto;
}


