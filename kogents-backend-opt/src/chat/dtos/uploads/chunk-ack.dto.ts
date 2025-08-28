import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChunkAckDto {
    @ApiProperty()
    sessionId: string;

    @ApiProperty()
    chunkIndex: number;

    @ApiProperty()
    received: boolean;

    @ApiProperty()
    uploadedChunks: number;

    @ApiProperty()
    totalChunks: number;

    @ApiPropertyOptional()
    nextChunkIndex?: number;

    @ApiProperty({ enum: ['initiated', 'uploading'] })
    status: 'initiated' | 'uploading';
}