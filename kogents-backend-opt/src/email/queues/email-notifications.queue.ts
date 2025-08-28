import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { STANDARD_WORKER_CONFIG } from '../../common/workers/worker-config';

export const emailQueueProvider = {
    provide: 'EMAIL_QUEUE',
    useFactory: (redisConnection: Redis) => {
        return new Queue('email_notifications', {
            connection: redisConnection,
            defaultJobOptions: STANDARD_WORKER_CONFIG.defaultJobOptions,
        });
    },
    inject: ['REDIS_CONNECTION'],
};