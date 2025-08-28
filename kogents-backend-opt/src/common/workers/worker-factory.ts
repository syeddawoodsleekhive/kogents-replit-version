import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../logger/app-logger.service';
import { BaseWorker } from './base-worker';

/**
 * Factory function for creating standardized worker providers
 * Ensures all workers use consistent dependency injection and setup
 */
export const createWorkerProvider = <T extends BaseWorker>(
    providerToken: string,
    WorkerClass: new (...args: any[]) => T,
    additionalDeps: string[] = []
) => ({
    provide: providerToken,
    useFactory: (
        redisConnection: Redis,
        prisma: PrismaService,
        logger: AppLoggerService,
        ...additionalServices: any[]
    ) => {
        const worker = new WorkerClass(prisma, logger, redisConnection, ...additionalServices);
        return worker.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService, ...additionalDeps],
});

/**
 * Helper function to create multiple worker providers at once
 */
export const createWorkerProviders = (
    workerConfigs: Array<{
        providerToken: string;
        WorkerClass: new (...args: any[]) => BaseWorker;
        additionalDeps?: string[];
    }>
) => {
    return workerConfigs.map(config =>
        createWorkerProvider(
            config.providerToken,
            config.WorkerClass,
            config.additionalDeps
        )
    );
};

/**
 * Factory function for creating legacy worker providers (for backward compatibility)
 * Use this for workers that don't extend BaseWorker yet
 */
export const createLegacyWorkerProvider = (
    providerToken: string,
    workerFactory: (...args: any[]) => any,
    dependencies: string[]
) => ({
    provide: providerToken,
    useFactory: workerFactory,
    inject: dependencies,
}); 