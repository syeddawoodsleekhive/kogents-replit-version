import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { ExportCannedResponseDto } from '../dtos/export-canned-response.dto';

export interface CannedResponsesImportJob {
    type: 'canned_responses_import';
    workspaceId: string;
    userId: string;
    items: ExportCannedResponseDto[];
}

export type CannedResponsesJobData = CannedResponsesImportJob;

export const cannedResponsesQueueProvider = {
    provide: 'CANNED_RESPONSES_QUEUE',
    useFactory: (redisConnection: Redis) => {
        return new Queue('canned-responses', {
            connection: redisConnection,
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 100,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        });
    },
    inject: ['REDIS_CONNECTION'],
};

@Injectable()
export class CannedResponsesQueue {
    constructor(
        @Inject('CANNED_RESPONSES_QUEUE') private readonly queue: Queue<CannedResponsesJobData>,
        private readonly logger: AppLoggerService
    ) {
        this.logger.log('Canned Responses Queue initialized', 'CannedResponsesQueue');
    }

    getQueue(): Queue<CannedResponsesJobData> {
        return this.queue;
    }

    async queueImportCannedResponses(workspaceId: string, userId: string, items: ExportCannedResponseDto[]): Promise<any> {
        const job = await this.queue.add(
            'canned_responses_import',
            {
                type: 'canned_responses_import',
                workspaceId,
                userId,
                items,
            },
            {
                priority: 7,
            }
        );

        this.logger.log(`Canned responses import job queued: ${job.id} for workspace ${workspaceId}`, 'CannedResponsesQueue');
        return job;
    }
}


