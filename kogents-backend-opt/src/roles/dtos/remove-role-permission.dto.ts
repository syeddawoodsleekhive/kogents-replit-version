import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveRolePermissionDto {
    @ApiProperty({
        description: 'Permission ID to remove from the role',
        example: 'clx1234567890abcdef'
    })
    @IsNotEmpty({ message: 'Permission ID is required' })
    @IsString({ message: 'Permission ID must be a string' })
    permissionId: string;
} 