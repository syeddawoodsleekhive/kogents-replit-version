import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING',
}

export class CreateUserDto {
    @ApiProperty({
        description: 'User full name',
        example: 'John Doe'
    })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecurePassword123!',
        minLength: 8
    })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({
        description: 'Role name for the user',
        example: 'Developer'
    })
    @IsString()
    role_name: string;

    @ApiProperty({
        description: 'User status',
        enum: UserStatus,
        example: UserStatus.ACTIVE
    })
    @IsEnum(UserStatus)
    status: UserStatus;

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