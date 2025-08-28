// src/triggers/queues/triggers.queue.ts
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export interface TriggerEventJob {
    type: 'trigger_event';
    workspaceId: string;
    eventType: string;
    payload: Record<string, any>;
    departmentId?: string | null;
}

export type TriggersJobData = TriggerEventJob;

export const triggersQueueProvider = {
    provide: 'TRIGGERS_QUEUE',
    useFactory: (redisConnection: Redis) => {
        return new Queue<TriggersJobData>('triggers', {
            connection: redisConnection,
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 200,
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