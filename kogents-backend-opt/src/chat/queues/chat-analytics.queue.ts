import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export const chatAnalyticsQueueProvider = {
    provide: 'CHAT_ANALYTICS_QUEUE',
    useFactory: (redisConnection: Redis) => {
        return new Queue('chat-analytics', {
            connection: redisConnection,
        });
    },
    inject: ['REDIS_CONNECTION'],
}; 