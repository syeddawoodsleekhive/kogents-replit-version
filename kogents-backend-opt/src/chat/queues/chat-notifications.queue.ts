import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export const chatNotificationsQueueProvider = {
    provide: 'CHAT_NOTIFICATIONS_QUEUE',
    useFactory: (redisConnection: Redis) => {
        return new Queue('chat-notifications', {
            connection: redisConnection,
        });
    },
    inject: ['REDIS_CONNECTION'],
}; 