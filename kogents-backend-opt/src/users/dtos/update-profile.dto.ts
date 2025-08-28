import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({
        description: 'User full name',
        example: 'John Doe'
    })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        description: 'User password (will be hashed)',
        example: 'NewSecurePassword123!',
        minLength: 8
    })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @ApiPropertyOptional({
        description: 'User phone number',
        example: '+1234567890'
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        description: 'User avatar URL',
        example: 'https://example.com/avatar.jpg'
    })
    @IsOptional()
    @IsString()
    avatarUrl?: string;
} 