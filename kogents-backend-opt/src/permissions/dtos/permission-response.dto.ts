import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
    @ApiProperty({
        description: 'Permission ID',
        example: 'clx1234567890abcdef'
    })
    id: string;

    @ApiProperty({
        description: 'Permission name',
        example: 'user.create'
    })
    name: string;

    @ApiProperty({
        description: 'Permission description',
        example: 'Create new users in the workspace'
    })
    description: string;

    @ApiProperty({
        description: 'Permission category',
        example: 'user-management'
    })
    category: string;

    @ApiProperty({
        description: 'Creation timestamp',
        example: '2024-01-01T00:00:00.000Z'
    })
    createdAt: Date;
} 