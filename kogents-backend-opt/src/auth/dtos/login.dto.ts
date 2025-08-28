import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
        type: String
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecurePassword123',
        type: String,
        minLength: 1
    })
    @IsNotEmpty()
    password: string;
}