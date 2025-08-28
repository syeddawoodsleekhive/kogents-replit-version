import { Worker, Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../logger/app-logger.service';
import { Redis } from 'ioredis';
import { STANDARD_WORKER_CONFIG, HEALTH_CHECK_INTERVALS } from './worker-config';

/**
 * Abstract base class for all workers
 * Provides standardized setup, error handling, and logging
 */
@Injectable()
export abstract class BaseWorker {
    /**
     * The queue name this worker will process
     */
    protected abstract readonly queueName: string;

    /**
     * The name used for logging (should match the class name)
     */
    protected abstract readonly processorName: string;

    /**
     * Number of concurrent jobs this worker can handle
     * Override in subclass if needed
     */
    protected concurrency = 5;

    /**
     * Health check interval for this worker type
     * Override in subclass if needed
     */
    protected healthCheckInterval = HEALTH_CHECK_INTERVALS.normal;

    constructor(
        protected readonly prisma: PrismaService,
        protected readonly logger: AppLoggerService,
        protected readonly redis: Redis,
    ) { }

    /**
     * Abstract method that subclasses must implement to process jobs
     */
    abstract processJob(job: Job): Promise<void>;

    /**
     * Creates and configures the worker with standardized setup
     */
    createWorker(): Worker {
        const worker = new Worker(
            this.queueName,
            this.processJobWithErrorHandling.bind(this),
            {
                connection: this.redis,
                concurrency: this.concurrency,
                ...STANDARD_WORKER_CONFIG,
            }
        );

        this.setupWorkerEvents(worker);
        this.setupHealthCheck();

        this.logger.log(`${this.processorName} worker created and started`, this.processorName);

        return worker;
    }

    /**
     * Wraps job processing with standardized error handling and logging
     */
    private async processJobWithErrorHandling(job: Job): Promise<void> {
        this.logger.log(`Processing job: ${job.name} (ID: ${job.id})`, this.processorName);

        try {
            await this.processJob(job);
            this.logger.log(`Completed job: ${job.name} (ID: ${job.id})`, this.processorName);
        } catch (error) {
            this.logger.error(
                `Job processing failed: ${job.name} (ID: ${job.id}) - ${error.message}`,
                error.stack,
                this.processorName,
                error
            );
            throw error; // Re-throw to trigger retry mechanism
        }
    }

    /**
     * Sets up standardized worker event handlers
     */
    private setupWorkerEvents(worker: Worker): void {
        worker.on('completed', (job) => {
            this.logger.log(`Job completed: ${job.name} (ID: ${job.id})`, this.processorName);
        });

        worker.on('failed', (job, err) => {
            this.logger.error(
                `Job failed: ${job?.name} (ID: ${job?.id}) - ${err.message}`,
                err.stack,
                this.processorName,
                err
            );
        });

        worker.on('error', (err) => {
            this.logger.error(`Worker error: ${err.message}`, err.stack, this.processorName, err);
        });

        worker.on('stalled', (jobId) => {
            this.logger.warn(`Job stalled: ${jobId}`, this.processorName);
        });

        worker.on('progress', (job, progress) => {
            if (typeof progress === 'number' && progress % 25 === 0) { // Log every 25%
                this.logger.log(`Job progress: ${job.name} (ID: ${job.id}) - ${progress}%`, this.processorName);
            }
        });
    }

    /**
     * Sets up periodic health check for the worker
     */
    private setupHealthCheck(): void {
        setInterval(async () => {
            try {
                await this.healthCheck();
            } catch (error) {
                this.logger.error(`Health check failed: ${error.message}`, error.stack, this.processorName, error);
            }
        }, this.healthCheckInterval);
    }

    /**
     * Performs health check - can be overridden by subclasses
     */
    protected async healthCheck(): Promise<void> {
        try {
            // Basic Redis connectivity check
            await this.redis.ping();

            // Basic database connectivity check
            await this.prisma.$queryRaw`SELECT 1`;

            this.logger.log('Health check passed', this.processorName);
        } catch (error) {
            this.logger.error(`Health check failed: ${error.message}`, error.stack, this.processorName, error);
            throw error;
        }
    }

    /**
     * Helper method for updating job progress
     */
    protected async updateProgress(job: Job, progress: number, message?: string): Promise<void> {
        try {
            await job.updateProgress(progress);
            if (message) {
                this.logger.log(`${message} (Progress: ${progress}%)`, this.processorName);
            }
        } catch (error) {
            this.logger.warn(`Failed to update job progress: ${error.message}`, this.processorName);
        }
    }

    /**
     * Helper method for caching results with consistent key patterns
     */
    protected async cacheResult(key: string, data: any, ttlSeconds = 3600): Promise<void> {
        try {
            const cacheKey = `${this.queueName}:${key}`;
            await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
            this.logger.log(`Cached result: ${cacheKey}`, this.processorName);
        } catch (error) {
            this.logger.warn(`Failed to cache result: ${error.message}`, this.processorName);
        }
    }

    /**
     * Helper method for retrieving cached results
     */
    protected async getCachedResult<T>(key: string): Promise<T | null> {
        try {
            const cacheKey = `${this.queueName}:${key}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Failed to retrieve cached result: ${error.message}`, this.processorName);
            return null;
        }
    }
} 