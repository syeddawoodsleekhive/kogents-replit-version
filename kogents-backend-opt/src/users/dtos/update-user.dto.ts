import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { UserStatus } from './create-user.dto';

export class UpdateUserDto {
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
        description: 'Role name for the user',
        example: 'Developer'
    })
    @IsOptional()
    @IsString()
    role_name?: string;

    @ApiPropertyOptional({
        description: 'User status',
        enum: UserStatus,
        example: UserStatus.ACTIVE
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

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