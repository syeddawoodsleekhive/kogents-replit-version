import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRolePermissionsDto {
    @ApiProperty({
        description: 'Array of permission IDs to assign to the role',
        example: ['perm1', 'perm2', 'perm3'],
        type: [String]
    })
    @IsArray({ message: 'Permission IDs must be an array' })
    @IsString({ each: true, message: 'Each permission ID must be a string' })
    permissionIds: string[];
} 