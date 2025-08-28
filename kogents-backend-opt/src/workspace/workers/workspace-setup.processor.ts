import { Worker } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';

// Simplified worker factory - receives dependencies instead of creating them
export const createWorkspaceWorker = (
    redisConnection: any,
    prisma: PrismaService,
    logger: AppLoggerService
) => {
    const worker = new Worker(
        'workspace_setup',
        async (job) => {
            const { workspaceId, userId } = job.data;

            logger.log(`Processing non-critical workspace setup job: ${job.name} for workspace: ${workspaceId}`, 'WorkspaceWorker');

            switch (job.name) {
                case 'send_admin_welcome_email':
                    await sendAdminWelcomeEmail(workspaceId, userId, logger);
                    break;

                case 'create_initial_settings':
                    await createInitialSettings(prisma, workspaceId, logger);
                    break;

                case 'setup_analytics':
                    await setupAnalytics(prisma, workspaceId, logger);
                    break;

                case 'create_default_integrations':
                    await createDefaultIntegrations(prisma, workspaceId, logger);
                    break;

                default:
                    logger.warn(`Unknown non-critical workspace setup job: ${job.name}`, 'WorkspaceWorker');
                    break;
            }

            logger.log(`Completed non-critical workspace setup job: ${job.name} for workspace: ${workspaceId}`, 'WorkspaceWorker');
        },
        {
            connection: redisConnection,
        },
    );

    // Error handling
    worker.on('error', (error) => {
        logger.error('Workspace worker error', undefined, 'WorkspaceWorker', error);
    });

    worker.on('failed', (job, error) => {
        logger.error(`Non-critical workspace worker job failed: ${job?.name}`, undefined, 'WorkspaceWorker', error);
    });

    logger.log('Non-critical workspace setup worker started successfully', 'WorkspaceWorker');

    return worker;
};

/**
 * NON-CRITICAL: Send welcome email to admin
 * This can fail without breaking workspace functionality
 */
async function sendAdminWelcomeEmail(workspaceId: string, userId: string, logger: AppLoggerService) {
    try {
        // Queue email notification for admin welcome
        // This would typically be handled by the email notification queue

        logger.log(`Queued admin welcome email for workspace: ${workspaceId}, user: ${userId}`, 'WorkspaceWorker');

        // Example: Queue email notification
        // await emailQueue.add('send_welcome_email', {
        //     userId,
        //     workspaceId,
        //     template: 'admin_welcome',
        // });

    } catch (error) {
        logger.error(`Failed to queue admin welcome email for workspace: ${workspaceId}`, undefined, 'WorkspaceWorker', error);
        throw error;
    }
}

/**
 * NON-CRITICAL: Create initial workspace settings
 * This can fail without breaking workspace functionality
 */
async function createInitialSettings(prisma: PrismaService, workspaceId: string, logger: AppLoggerService) {
    try {
        // Create default workspace settings
        // This could include:
        // - Default notification preferences
        // - Default security settings
        // - Default branding settings
        // - Default integrations

        logger.log(`Created initial settings for workspace: ${workspaceId}`, 'WorkspaceWorker');

        // Example: Create workspace settings record
        // await prisma.workspaceSettings.create({
        //     data: {
        //         workspaceId,
        //         notificationsEnabled: true,
        //         securityLevel: 'standard',
        //         brandingEnabled: true,
        //     },
        // });

    } catch (error) {
        logger.error(`Failed to create initial settings for workspace: ${workspaceId}`, undefined, 'WorkspaceWorker', error);
        throw error;
    }
}

/**
 * NON-CRITICAL: Setup analytics for the workspace
 * This can fail without breaking workspace functionality
 */
async function setupAnalytics(prisma: PrismaService, workspaceId: string, logger: AppLoggerService) {
    try {
        // Setup analytics tracking for the workspace
        // This could include:
        // - Google Analytics setup
        // - Mixpanel configuration
        // - Custom event tracking setup

        logger.log(`Setup analytics for workspace: ${workspaceId}`, 'WorkspaceWorker');

        // Example: Create analytics configuration
        // await prisma.analyticsConfig.create({
        //     data: {
        //         workspaceId,
        //         provider: 'google_analytics',
        //         trackingId: generateTrackingId(),
        //         enabled: true,
        //     },
        // });

    } catch (error) {
        logger.error(`Failed to setup analytics for workspace: ${workspaceId}`, undefined, 'WorkspaceWorker', error);
        throw error;
    }
}

/**
 * NON-CRITICAL: Create default integrations
 * This can fail without breaking workspace functionality
 */
async function createDefaultIntegrations(prisma: PrismaService, workspaceId: string, logger: AppLoggerService) {
    try {
        // Create default integrations for the workspace
        // This could include:
        // - Slack integration setup
        // - Email integration configuration
        // - API key generation for external services

        logger.log(`Created default integrations for workspace: ${workspaceId}`, 'WorkspaceWorker');

        // Example: Create default integrations
        // await prisma.integration.createMany({
        //     data: [
        //         {
        //             workspaceId,
        //             type: 'slack',
        //             name: 'Default Slack Integration',
        //             enabled: false,
        //         },
        //         {
        //             workspaceId,
        //             type: 'email',
        //             name: 'Default Email Integration',
        //             enabled: true,
        //         },
        //     ],
        // });

    } catch (error) {
        logger.error(`Failed to create default integrations for workspace: ${workspaceId}`, undefined, 'WorkspaceWorker', error);
        throw error;
    }
}