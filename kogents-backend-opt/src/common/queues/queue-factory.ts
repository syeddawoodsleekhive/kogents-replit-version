import { Queue, QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { STANDARD_WORKER_CONFIG } from '../workers/worker-config';

/**
 * Factory function for creating standardized queue providers
 * Ensures all queues use the shared Redis connection and consistent configuration
 */
export const createQueueProvider = (
    providerToken: string,
    queueName: string,
    options?: Partial<QueueOptions>
) => ({
    provide: providerToken,
    useFactory: (redisConnection: Redis) => {
        return new Queue(queueName, {
            connection: redisConnection,
            defaultJobOptions: STANDARD_WORKER_CONFIG.defaultJobOptions,
            ...options,
        });
    },
    inject: ['REDIS_CONNECTION'],
});

/**
 * Helper function to create multiple queue providers at once
 */
export const createQueueProviders = (
    queueConfigs: Array<{
        providerToken: string;
        queueName: string;
        options?: Partial<QueueOptions>;
    }>
) => {
    return queueConfigs.map(config =>
        createQueueProvider(config.providerToken, config.queueName, config.options)
    );
}; 