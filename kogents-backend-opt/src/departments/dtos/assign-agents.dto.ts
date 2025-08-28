import { IsArray, IsString, ArrayMinSize, ArrayMaxSize, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignAgentsDto {
    @ApiProperty({
        description: 'Array of agent user IDs to assign to the department',
        type: [String],
        example: ['clx1234567890abcdef', 'clx0987654321fedcba'],
        minItems: 1,
        maxItems: 50
    })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1, { message: 'At least one agent ID must be provided' })
    @ArrayMaxSize(50, { message: 'Cannot assign more than 50 agents at once' })
    agentIds: string[];

    @ApiProperty({
        description: 'Reason for assigning agents to the department',
        type: String,
        example: 'Assigning agents to the department for training purposes'
    })
    @IsString()
    @IsOptional()
    reason?: string;
} 