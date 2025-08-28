import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveRoleFromUserDto {
    @ApiProperty({
        description: 'Workspace ID',
        example: 'clx1234567890abcdef'
    })
    @IsNotEmpty({ message: 'Workspace ID is required' })
    @IsString({ message: 'Workspace ID must be a string' })
    workspaceId: string;
} 