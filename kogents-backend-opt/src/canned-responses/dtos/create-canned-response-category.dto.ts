import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCannedResponseCategoryDto {
    @ApiProperty({ description: 'Category name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Category color (hex or name)' })
    @IsString()
    color: string;

    @ApiPropertyOptional({ description: 'Category description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Sort order', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}


