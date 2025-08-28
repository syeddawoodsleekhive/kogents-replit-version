import { ApiProperty } from '@nestjs/swagger';

export class ChunkMapDto {
    @ApiProperty()
    sessionId: string;

    @ApiProperty()
    totalChunks: number;

    @ApiProperty()
    chunkSize: number;

    @ApiProperty({ type: [Number], description: 'Indices of chunks already received' })
    receivedIndices: number[];

    @ApiProperty()
    uploadedCount: number;
}