import { IsEmail, IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
    @ApiProperty({
        description: 'Email address to send password reset link to',
        example: 'user@example.com',
        type: String
    })
    @IsEmail()
    email: string;
}

export class ConfirmPasswordResetDto {
    @ApiProperty({
        description: 'Reset token from email link (email is retrieved from token)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        type: String
    })
    @IsNotEmpty({ message: 'Reset token is required' })
    @IsString({ message: 'Reset token must be a string' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    token: string;

    @ApiProperty({
        description: 'New password',
        example: 'newSecurePassword123!',
        type: String,
        minLength: 8
    })
    @IsNotEmpty({ message: 'New password is required' })
    @IsString({ message: 'Password must be a string' })
    @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
    )
    newPassword: string;
} 