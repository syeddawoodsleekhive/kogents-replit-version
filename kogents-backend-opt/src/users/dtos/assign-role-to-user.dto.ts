import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleToUserDto {
    @ApiProperty({
        description: 'Workspace ID',
        example: 'clx1234567890abcdef'
    })
    @IsNotEmpty({ message: 'Workspace ID is required' })
    @IsString({ message: 'Workspace ID must be a string' })
    workspaceId: string;

    @ApiProperty({
        description: 'Role ID to assign to the user',
        example: 'clx1234567890abcdef'
    })
    @IsNotEmpty({ message: 'Role ID is required' })
    @IsString({ message: 'Role ID must be a string' })
    roleId: string;
} 