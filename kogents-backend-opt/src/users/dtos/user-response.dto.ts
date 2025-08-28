import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from './create-user.dto';

export class UserRoleDto {
    @ApiProperty({
        description: 'Role ID',
        example: 'clx1234567890abcdef'
    })
    id: string;

    @ApiProperty({
        description: 'Role name',
        example: 'Developer'
    })
    name: string;

    @ApiProperty({
        description: 'Role description',
        example: 'Can create and edit resources'
    })
    description: string;

    @ApiProperty({
        description: 'Whether this is a system role',
        example: true
    })
    isSystem: boolean;

    @ApiProperty({
        description: 'Whether the role is active',
        example: true
    })
    isActive: boolean;
}

export class UserPermissionDto {
    @ApiProperty({
        description: 'Permission ID',
        example: 'clx1234567890abcdef'
    })
    id: string;

    @ApiProperty({
        description: 'Permission name',
        example: 'user.view'
    })
    name: string;

    @ApiProperty({
        description: 'Permission description',
        example: 'View users'
    })
    description: string;

    @ApiProperty({
        description: 'Permission category',
        example: 'user_management'
    })
    category: string;
}

export class WorkspaceDto {
    @ApiProperty({
        description: 'Workspace ID',
        example: 'clx1234567890abcdef'
    })
    id: string;

    @ApiProperty({
        description: 'Workspace name',
        example: 'My Workspace'
    })
    name: string;

    @ApiProperty({
        description: 'Workspace slug',
        example: 'my-workspace'
    })
    slug: string;
}

export class UserResponseDto {
    @ApiProperty({
        description: 'User ID',
        example: 'clx1234567890abcdef'
    })
    id: string;

    @ApiProperty({
        description: 'User full name',
        example: 'John Doe'
    })
    name: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    email: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+1234567890'
    })
    phone: string | null;

    @ApiProperty({
        description: 'User status',
        enum: UserStatus,
        example: UserStatus.ACTIVE
    })
    status: UserStatus;

    @ApiPropertyOptional({
        description: 'User avatar URL',
        example: 'https://example.com/avatar.jpg'
    })
    avatarUrl: string | null;

    @ApiProperty({
        description: 'Workspace ID',
        example: 'clx1234567890abcdef'
    })
    workspaceId: string;

    @ApiProperty({
        description: 'Workspace information',
        type: WorkspaceDto
    })
    workspace: WorkspaceDto;

    @ApiProperty({
        description: 'User role information',
        type: UserRoleDto
    })
    role: UserRoleDto;

    @ApiProperty({
        description: 'User permissions through role',
        type: [UserPermissionDto]
    })
    permissions: UserPermissionDto[];

    @ApiPropertyOptional({
        description: 'User creation timestamp',
        example: '2024-01-15T10:30:00.000Z'
    })
    createdAt?: Date;

    @ApiPropertyOptional({
        description: 'User last update timestamp',
        example: '2024-01-15T10:30:00.000Z'
    })
    updatedAt?: Date;

    @ApiPropertyOptional({
        description: 'User last active timestamp',
        example: '2024-01-15T10:30:00.000Z'
    })
    lastActiveAt?: Date;
} 