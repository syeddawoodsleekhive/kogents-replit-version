import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
    @ApiProperty({
        description: 'Role name',
        example: 'Senior Developer',
        required: false,
        minLength: 2,
        maxLength: 50
    })
    @IsOptional()
    @IsString({ message: 'Role name must be a string' })
    @Length(2, 50, { message: 'Role name must be between 2 and 50 characters' })
    name?: string;

    @ApiProperty({
        description: 'Role description',
        example: 'Can create, edit, and review resources',
        required: false,
        maxLength: 200
    })
    @IsOptional()
    @IsString({ message: 'Role description must be a string' })
    @Length(0, 200, { message: 'Role description must not exceed 200 characters' })
    description?: string;
} 