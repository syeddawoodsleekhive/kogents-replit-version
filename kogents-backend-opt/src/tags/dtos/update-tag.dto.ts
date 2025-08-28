import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTagDto {
    @ApiPropertyOptional({ description: 'Tag name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Tag color' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ description: 'Tag description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Tag category ID (set null to remove)' })
    @IsOptional()
    @IsString()
    categoryId?: string | null;
}


