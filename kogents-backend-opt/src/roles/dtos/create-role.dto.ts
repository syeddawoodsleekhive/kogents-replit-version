import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
    @ApiProperty({
        description: 'Role name',
        example: 'Developer',
        minLength: 2,
        maxLength: 50
    })
    @IsNotEmpty({ message: 'Role name is required' })
    @IsString({ message: 'Role name must be a string' })
    @Length(2, 50, { message: 'Role name must be between 2 and 50 characters' })
    name: string;

    @ApiProperty({
        description: 'Role description',
        example: 'Can create and edit resources',
        required: false,
        maxLength: 200
    })
    @IsOptional()
    @IsString({ message: 'Role description must be a string' })
    @Length(0, 200, { message: 'Role description must not exceed 200 characters' })
    description?: string;
} 