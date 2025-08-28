import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmOtpDto {
    @ApiProperty({
        description: '6-digit OTP code',
        example: '123456',
        type: String,
        minLength: 6,
        maxLength: 6
    })
    @IsNotEmpty({ message: 'OTP code is required' })
    @IsString({ message: 'OTP code must be a string' })
    @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
    @Matches(/^\d{6}$/, { message: 'OTP code must contain only digits' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    code: string;
}