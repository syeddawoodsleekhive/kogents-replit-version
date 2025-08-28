import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { workspaceSetupQueueProvider } from './workspace/queues/workspace-setup.queue';
import { emailQueueProvider } from './email/queues/email-notifications.queue';
import { analyticsQueueProvider } from './analytics/queues/analytics.queue';
import { Redis } from 'ioredis';
import { EmailService } from './email/workers/email.processor';
import { AppLoggerService } from './common/logger/app-logger.service';
import { RegistrationSessionsProcessor } from './analytics/workers/registration-sessions.processor';
import { MarketingAttributionProcessor } from './analytics/workers/marketing-attribution.processor';
import { SecurityEventsProcessor } from './analytics/workers/security-events.processor';
import { UserInteractionsProcessor } from './analytics/workers/user-interactions.processor';
import { PrismaService } from './prisma/prisma.service';

// Chat queue and worker imports
import { chatAnalyticsQueueProvider } from './chat/queues/chat-analytics.queue';
import { chatNotificationsQueueProvider } from './chat/queues/chat-notifications.queue';
import { ChatAnalyticsProcessor } from './chat/workers/chat-analytics.processor';
import { ChatNotificationsProcessor } from './chat/workers/chat-notifications.processor';

// Workspace worker imports
import { createWorkspaceWorker } from './workspace/workers/workspace-setup.processor';

// Email worker imports
import { createEmailWorker } from './email/workers/email.processor';

// File processing queue and worker imports
import { fileProcessingQueueProvider } from './chat/queues/file-processing.queue';
import { cannedResponsesQueueProvider } from './canned-responses/queues/canned-responses.queue';
import { FileProcessingProcessor } from './chat/workers/file-processing.processor';
import { CannedResponsesProcessor } from './canned-responses/workers/canned-responses.processor';

// Triggers queue provider
import { triggersQueueProvider } from './triggers/queues/triggers.queue';

// Centralized Redis connection provider
export const redisConnectionProvider = {
    provide: 'REDIS_CONNECTION',
    useFactory: (config: ConfigService) => {
        const redisHost = config.get<string>('redis.host');
        const redisPort = config.get<number>('redis.port');

        if (!redisHost || !redisPort) {
            throw new Error('Missing required Redis configuration');
        }

        return new Redis({
            host: redisHost,
            port: redisPort,
            maxRetriesPerRequest: null, // BullMQ requires this to be null
        });
    },
    inject: [ConfigService],
};

// Centralized Email Service provider
export const emailServiceProvider = {
    provide: 'EMAIL_SERVICE',
    useFactory: (config: ConfigService, logger: AppLoggerService) => {
        const emailHost = config.get<string>('email.host');
        const emailPort = config.get<number>('email.port');
        const emailUser = config.get<string>('email.user');
        const emailPassword = config.get<string>('email.password');
        const emailFrom = config.get<string>('email.from');

        if (!emailHost || !emailPort || !emailUser || !emailPassword || !emailFrom) {
            throw new Error('Missing required email configuration');
        }

        const emailConfig = {
            host: emailHost,
            port: emailPort,
            secure: config.get<boolean>('email.secure') || false,
            auth: {
                user: emailUser,
                pass: emailPassword,
            },
            from: emailFrom,
            replyTo: config.get<string>('email.replyTo'),
        };

        return new EmailService(emailConfig, logger);
    },
    inject: [ConfigService, AppLoggerService],
};

// Analytics worker providers
export const registrationSessionsWorkerProvider = {
    provide: 'REGISTRATION_SESSIONS_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService) => {
        const processor = new RegistrationSessionsProcessor(prisma, logger, redisConnection);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService],
};

export const marketingAttributionWorkerProvider = {
    provide: 'MARKETING_ATTRIBUTION_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService) => {
        const processor = new MarketingAttributionProcessor(prisma, logger, redisConnection);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService],
};

export const securityEventsWorkerProvider = {
    provide: 'SECURITY_EVENTS_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService) => {
        const processor = new SecurityEventsProcessor(prisma, logger, redisConnection);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService],
};

export const userInteractionsWorkerProvider = {
    provide: 'USER_INTERACTIONS_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService) => {
        const processor = new UserInteractionsProcessor(prisma, logger, redisConnection);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService],
};

// Chat worker providers
export const chatAnalyticsWorkerProvider = {
    provide: 'CHAT_ANALYTICS_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService) => {
        const processor = new ChatAnalyticsProcessor(prisma, logger, redisConnection);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService],
};

export const chatNotificationsWorkerProvider = {
    provide: 'CHAT_NOTIFICATIONS_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService, emailService: any) => {
        const processor = new ChatNotificationsProcessor(prisma, logger, redisConnection, emailService);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService, 'EMAIL_SERVICE'],
};

// Workspace setup worker provider
export const workspaceSetupWorkerProvider = {
    provide: 'WORKSPACE_SETUP_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService) => {
        return createWorkspaceWorker(redisConnection, prisma, logger);
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService],
};

// Email worker provider
export const emailWorkerProvider = {
    provide: 'EMAIL_WORKER',
    useFactory: (redisConnection: Redis, emailService: EmailService, logger: AppLoggerService) => {
        return createEmailWorker(redisConnection, emailService, logger);
    },
    inject: ['REDIS_CONNECTION', 'EMAIL_SERVICE', AppLoggerService],
};

// File processing worker provider
export const fileProcessingWorkerProvider = {
    provide: 'FILE_PROCESSING_WORKER',
    useFactory: (redisConnection: Redis, logger: AppLoggerService) => {
        const processor = new FileProcessingProcessor(logger, redisConnection);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', AppLoggerService],
};

// Canned responses worker provider
export const cannedResponsesWorkerProvider = {
    provide: 'CANNED_RESPONSES_WORKER',
    useFactory: (redisConnection: Redis, prisma: PrismaService, logger: AppLoggerService) => {
        const processor = new CannedResponsesProcessor(prisma, logger, redisConnection);
        return processor.createWorker();
    },
    inject: ['REDIS_CONNECTION', PrismaService, AppLoggerService],
};

@Global()
@Module({
    providers: [
        AppLoggerService, // Make AppLoggerService available for DI
        redisConnectionProvider,
        emailServiceProvider,
        // Queue providers
        workspaceSetupQueueProvider,
        emailQueueProvider,
        analyticsQueueProvider,
        chatAnalyticsQueueProvider,
        chatNotificationsQueueProvider,
        fileProcessingQueueProvider,
        cannedResponsesQueueProvider,
        triggersQueueProvider,
        // Worker providers
        registrationSessionsWorkerProvider,
        marketingAttributionWorkerProvider,
        securityEventsWorkerProvider,
        userInteractionsWorkerProvider,
        chatAnalyticsWorkerProvider,
        chatNotificationsWorkerProvider,
        workspaceSetupWorkerProvider,
        emailWorkerProvider,
        fileProcessingWorkerProvider,
        cannedResponsesWorkerProvider,
    ],
    exports: [
        'REDIS_CONNECTION',
        'EMAIL_SERVICE',
        // Queue providers
        workspaceSetupQueueProvider,
        emailQueueProvider,
        analyticsQueueProvider,
        chatAnalyticsQueueProvider,
        chatNotificationsQueueProvider,
        fileProcessingQueueProvider,
        cannedResponsesQueueProvider,
        triggersQueueProvider,
        // Worker providers
        registrationSessionsWorkerProvider,
        marketingAttributionWorkerProvider,
        securityEventsWorkerProvider,
        userInteractionsWorkerProvider,
        chatAnalyticsWorkerProvider,
        chatNotificationsWorkerProvider,
        workspaceSetupWorkerProvider,
        emailWorkerProvider,
        fileProcessingWorkerProvider,
        cannedResponsesWorkerProvider,
    ],
})
export class QueueModule { }
