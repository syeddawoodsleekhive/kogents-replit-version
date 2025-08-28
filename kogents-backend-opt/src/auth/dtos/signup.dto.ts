import { IsEmail, IsNotEmpty, MinLength, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    type: String,
    minLength: 1,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^[a-zA-Z\s\-'\.]+$/, { message: 'Name contains invalid characters' })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    type: String,
    maxLength: 254
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(5, 254, { message: 'Email must be between 5 and 254 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email: string;

  @ApiProperty({
    description: 'User password (must be at least 8 characters with uppercase, lowercase, number, and special character)',
    example: 'SecurePassword123!',
    type: String,
    minLength: 8,
    maxLength: 128
  })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}
