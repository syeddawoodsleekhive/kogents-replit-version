import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Length, IsHexColor } from 'class-validator';

export class UpdateDepartmentDto {
    @ApiPropertyOptional({
        description: 'Department name',
        example: 'Sales',
        minLength: 2,
        maxLength: 100
    })
    @IsOptional()
    @IsString({ message: 'Department name must be a string' })
    @Length(2, 100, { message: 'Department name must be between 2 and 100 characters' })
    name?: string;

    @ApiPropertyOptional({
        description: 'Department description',
        example: 'Handles all sales-related inquiries and customer acquisition',
        maxLength: 500
    })
    @IsOptional()
    @IsString({ message: 'Department description must be a string' })
    @Length(0, 500, { message: 'Department description must not exceed 500 characters' })
    description?: string;

    @ApiPropertyOptional({
        description: 'Department color for UI branding (hex color)',
        example: '#3B82F6',
        pattern: '^#[0-9A-Fa-f]{6}$'
    })
    @IsOptional()
    @IsString({ message: 'Color must be a string' })
    @IsHexColor({ message: 'Color must be a valid hex color' })
    color?: string;

    @ApiPropertyOptional({
        description: 'Department icon identifier',
        example: 'sales-icon',
        maxLength: 50
    })
    @IsOptional()
    @IsString({ message: 'Icon must be a string' })
    @Length(0, 50, { message: 'Icon identifier must not exceed 50 characters' })
    icon?: string;

    @ApiPropertyOptional({
        description: 'Whether the department is active',
        example: true
    })
    @IsOptional()
    @IsBoolean({ message: 'isActive must be a boolean' })
    isActive?: boolean;
} 