import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Min, Max, IsInt } from 'class-validator';

export class FindCannedResponsesDto {
    @ApiPropertyOptional({ description: 'Category ID to filter by' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Search term for title/content/tags' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1, maximum: 100 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}