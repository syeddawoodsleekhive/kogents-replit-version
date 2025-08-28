import { IsNotEmpty, IsOptional, IsString, Length, Matches, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
    @ApiProperty({
        description: 'Workspace name',
        example: 'Acme Corporation',
        minLength: 2,
        maxLength: 100
    })
    @IsNotEmpty({ message: 'Workspace name is required' })
    @IsString({ message: 'Workspace name must be a string' })
    @Length(2, 100, { message: 'Workspace name must be between 2 and 100 characters' })
    name: string;

    @ApiProperty({
        description: 'Workspace slug (URL-friendly identifier)',
        example: 'acme-corp',
        minLength: 2,
        maxLength: 50
    })
    @IsNotEmpty({ message: 'Workspace slug is required' })
    @IsString({ message: 'Workspace slug must be a string' })
    @Length(2, 50, { message: 'Workspace slug must be between 2 and 50 characters' })
    @Matches(/^[a-z0-9-]+$/, {
        message: 'Workspace slug can only contain lowercase letters, numbers, and hyphens'
    })
    slug: string;

    @ApiProperty({
        description: 'Workspace branding configuration (optional)',
        example: {
            logo: 'https://example.com/logo.png',
            primaryColor: '#007bff',
            companyName: 'Acme Corp'
        },
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'Branding must be an object' })
    branding?: Record<string, any>;
}
