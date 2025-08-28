import { IsEmail, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VerificationType {
    workspace_creation = 'workspace_creation',
    user_invitation = 'user_invitation',
    password_reset = 'password_reset',
    email_change = 'email_change',
}

export class SendOtpForSignupDto {
    @ApiProperty({
        description: 'Email address for signup verification',
        example: 'admin@company.com',
        type: String
    })
    @IsEmail()
    email: string;
}

export class SendOtpForSignupSessionDto {
    @ApiProperty({
        description: 'Session ID from signup process',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        type: String
    })
    @IsNotEmpty({ message: 'Session ID is required' })
    @IsString({ message: 'Session ID must be a string' })
    sessionId: string;
}

export class ConfirmOtpForSignupDto {
    @ApiProperty({
        description: 'Email address for signup verification',
        example: 'admin@company.com',
        type: String
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: '6-digit OTP code',
        example: '123456',
        type: String,
        minLength: 6,
        maxLength: 6
    })
    @IsNotEmpty({ message: 'OTP code is required' })
    @IsString({ message: 'OTP code must be a string' })
    code: string;
}

export class ConfirmOtpForSignupSessionDto {
    @ApiProperty({
        description: 'Session ID from signup process',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        type: String
    })
    @IsNotEmpty({ message: 'Session ID is required' })
    @IsString({ message: 'Session ID must be a string' })
    sessionId: string;

    @ApiProperty({
        description: '6-digit OTP code',
        example: '123456',
        type: String,
        minLength: 6,
        maxLength: 6
    })
    @IsNotEmpty({ message: 'OTP code is required' })
    @IsString({ message: 'OTP code must be a string' })
    code: string;
}