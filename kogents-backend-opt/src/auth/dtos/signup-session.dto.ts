import { IsNotEmpty, IsString, IsEnum, IsOptional, Length, Matches, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SignupStep {
  SIGNUP = 'signup',
  WORKSPACE_CREATED = 'workspace_created',
  EMAIL_SENT = 'email_sent',
  PENDING_VERIFICATION = 'pending_verification',
}

export class ResumeSignupDto {
  @ApiProperty({
    description: 'Session ID from previous signup attempt',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String
  })
  @IsNotEmpty({ message: 'Session ID is required' })
  @IsString({ message: 'Session ID must be a string' })
  sessionId: string;
}

export class CreateWorkspaceForSignupDto {
  @ApiProperty({
    description: 'Session ID from signup process',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String
  })
  @IsNotEmpty({ message: 'Session ID is required' })
  @IsString({ message: 'Session ID must be a string' })
  sessionId: string;

  @ApiProperty({
    description: 'Workspace name',
    example: 'My Company',
    type: String,
    minLength: 1,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'Workspace name is required' })
  @Length(1, 100, { message: 'Workspace name must be between 1 and 100 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^[a-zA-Z0-9\s\-'\.]+$/, { message: 'Workspace name contains invalid characters' })
  name: string;

  @ApiProperty({
    description: 'Workspace slug (unique identifier)',
    example: 'my-company',
    type: String,
    minLength: 3,
    maxLength: 50
  })
  @IsNotEmpty({ message: 'Workspace slug is required' })
  @Length(3, 50, { message: 'Workspace slug must be between 3 and 50 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  @Matches(/^[a-z0-9\-]+$/, { message: 'Workspace slug must contain only lowercase letters, numbers, and hyphens' })
  slug: string;

  @ApiProperty({
    description: 'Workspace branding configuration (optional)',
    example: { logo: 'https://example.com/logo.png', primaryColor: '#007bff' }
  })
  @IsOptional()
  branding?: any;
}

