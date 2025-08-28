import { ApiProperty } from '@nestjs/swagger';

export class VisitorSessionResponseDto {
    @ApiProperty({
        description: 'Session ID',
        example: 'sess_1234567890abcdef'
    })
    sessionId: string;

    @ApiProperty({
        description: 'Whether visitor has existing conversation',
        example: false
    })
    existingConversation: boolean;
} 