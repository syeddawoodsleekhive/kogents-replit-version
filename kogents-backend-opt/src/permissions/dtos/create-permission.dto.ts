import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
    @ApiProperty({
        description: 'Permission name',
        example: 'user.create'
    })
    @IsNotEmpty({ message: 'Permission name is required' })
    @IsString({ message: 'Permission name must be a string' })
    name: string;

    @ApiProperty({
        description: 'Permission description',
        example: 'Create new users in the workspace'
    })
    @IsNotEmpty({ message: 'Permission description is required' })
    @IsString({ message: 'Permission description must be a string' })
    description: string;

    @ApiProperty({
        description: 'Permission category',
        example: 'user-management'
    })
    @IsNotEmpty({ message: 'Permission category is required' })
    @IsString({ message: 'Permission category must be a string' })
    category: string;
} 