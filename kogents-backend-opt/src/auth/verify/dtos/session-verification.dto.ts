import { IsNotEmpty, IsString, Length, Matches, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Email-based verification DTOs for admin signup flow
 * These DTOs handle OTP verification within Redis-cached signup data
 */

export class SendOtpForSignupDto {
    @ApiProperty({
        description: 'Email address from signup',
        example: 'john.doe@example.com',
        type: String
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
    @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
    email: string;
}

export class ConfirmOtpForSignupDto {
    @ApiProperty({
        description: 'Email address from signup',
        example: 'john.doe@example.com',
        type: String
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
    @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
    email: string;

    @ApiProperty({
        description: '6-digit verification code',
        example: '123456'
    })
    @IsNotEmpty({ message: 'OTP code is required' })
    @IsString({ message: 'OTP code must be a string' })
    @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
    @Matches(/^\d{6}$/, { message: 'OTP code must contain only digits' })
    code: string;
} 