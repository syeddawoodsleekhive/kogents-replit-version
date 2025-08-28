import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePermissionDto {
    @ApiPropertyOptional({
        description: 'Permission name',
        example: 'user.create'
    })
    @IsOptional()
    @IsString({ message: 'Permission name must be a string' })
    name?: string;

    @ApiPropertyOptional({
        description: 'Permission description',
        example: 'Create new users in the workspace'
    })
    @IsOptional()
    @IsString({ message: 'Permission description must be a string' })
    description?: string;

    @ApiPropertyOptional({
        description: 'Permission category',
        example: 'user-management'
    })
    @IsOptional()
    @IsString({ message: 'Permission category must be a string' })
    category?: string;
} 