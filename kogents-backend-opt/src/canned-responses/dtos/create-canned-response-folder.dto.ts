import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCannedResponseFolderDto {
    @ApiProperty({ description: 'Folder name' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Parent folder ID' })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiPropertyOptional({ description: 'Sort order', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}


