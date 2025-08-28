import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
    @ApiProperty({ description: 'Tag name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Tag color (hex or name)' })
    @IsString()
    color: string;

    @ApiPropertyOptional({ description: 'Optional description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Optional tag category ID' })
    @IsOptional()
    @IsString()
    categoryId?: string;
}


