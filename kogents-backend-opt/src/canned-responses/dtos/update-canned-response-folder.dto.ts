import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCannedResponseFolderDto {
    @ApiPropertyOptional({ description: 'Folder name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Parent folder ID' })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiPropertyOptional({ description: 'Sort order' })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}


