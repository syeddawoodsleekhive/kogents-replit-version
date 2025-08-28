import { QueueOptions } from 'bullmq';

/**
 * Standard worker configuration applied to all workers
 */
export const STANDARD_WORKER_CONFIG = {
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: 'exponential' as const,
            delay: 2000,
        },
    },
};

/**
 * Optimized concurrency settings per worker type
 * Based on workload characteristics and resource requirements
 */
export const WORKER_CONCURRENCY = {
    // Analytics workers - moderate concurrency for database operations
    analytics: 3,
    registration_sessions: 3,
    marketing_attribution: 3,
    security_events: 3,
    user_interactions: 3,

    // Chat workers - optimized per use case
    chat_cleanup: 1,        // Sequential processing for data integrity
    chat_analytics: 2,      // Moderate load with database writes
    chat_notifications: 5,  // High priority, needs responsive processing

    // Widget workers - moderate concurrency
    widget_management: 5,   // Can handle multiple widget operations
    widget_analytics: 3,    // Database intensive operations

    // Email workers - high throughput needed
    email: 10,              // High concurrency for email sending

    // Workspace workers - low priority background tasks
    workspace_setup: 2,     // Non-critical background operations
};

/**
 * Standard retry configuration for failed jobs
 */
export const RETRY_CONFIG = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
};

/**
 * Health check intervals for different worker types (in milliseconds)
 */
export const HEALTH_CHECK_INTERVALS = {
    critical: 60000,    // 1 minute - for email, chat notifications
    normal: 300000,     // 5 minutes - for analytics, widget management
    background: 900000, // 15 minutes - for cleanup, workspace setup
}; 