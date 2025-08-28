import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/logger/app-logger.service';

export interface ConnectionPoolMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    idleInTransaction: number;
    utilizationPercentage: number;
    timestamp: Date;
}

export interface SlowQueryMetrics {
    query: string;
    calls: number;
    totalTime: number;
    meanTime: number;
    rows: number;
    impact: 'high' | 'medium' | 'low';
}

@Injectable()
export class DatabaseMonitorService {
    private readonly maxConnections: number;
    private readonly slowQueryThreshold: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly logger: AppLoggerService,
    ) {
        this.maxConnections = this.configService.get('database.maxConnections', 20);
        this.slowQueryThreshold = this.configService.get('database.slowQueryThreshold', 1000);
    }

    /**
     * Get current connection pool status
     */
    async getConnectionPoolStatus(): Promise<ConnectionPoolMetrics> {
        try {
            const status = await this.prisma.getConnectionPoolStatus();

            if (!status) {
                throw new Error('Failed to get connection pool status');
            }

            // Explicitly convert all values to Number to avoid BigInt/number mixing
            const totalConnections = Number(status.total_connections);
            const activeConnections = Number(status.active_connections);
            const idleConnections = Number(status.idle_connections);
            const idleInTransaction = Number(status.idle_in_transaction);
            const utilizationPercentage = (activeConnections / this.maxConnections) * 100;

            return {
                totalConnections,
                activeConnections,
                idleConnections,
                idleInTransaction,
                utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error('Failed to get connection pool status', error, 'DatabaseMonitorService');
            throw error;
        }
    }

    /**
     * Get slow queries analysis
     */
    async getSlowQueriesAnalysis(): Promise<SlowQueryMetrics[]> {
        try {
            const slowQueries = await this.prisma.getSlowQueries(this.slowQueryThreshold);

            return slowQueries.map(query => ({
                query: query.query,
                calls: query.calls,
                totalTime: query.total_time,
                meanTime: query.mean_time,
                rows: query.rows,
                impact: this.calculateQueryImpact(query.mean_time, query.calls),
            }));
        } catch (error) {
            // Log the error but don't throw - slow query analysis is non-critical
            // pg_stat_statements extension might not be installed
            this.logger.warn('Slow query analysis unavailable - pg_stat_statements extension may not be installed', 'DatabaseMonitorService', {
                error: error.message,
                code: error.code,
            });
            return [];
        }
    }

    /**
     * Calculate query impact based on execution time and frequency
     */
    private calculateQueryImpact(meanTime: number, calls: number): 'high' | 'medium' | 'low' {
        const impactScore = meanTime * calls;

        if (impactScore > 10000) return 'high';
        if (impactScore > 1000) return 'medium';
        return 'low';
    }

    /**
     * Monitor connection pool health every 5 minutes
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async monitorConnectionPool() {
        try {
            const metrics = await this.getConnectionPoolStatus();

            // Log warning if utilization is high
            if (metrics.utilizationPercentage > 80) {
                this.logger.warn(`High connection pool utilization: ${metrics.utilizationPercentage}%`, 'DatabaseMonitorService', {
                    activeConnections: metrics.activeConnections,
                    totalConnections: metrics.totalConnections,
                    maxConnections: this.maxConnections,
                });
            }

            // Log info for normal operation
            if (metrics.utilizationPercentage > 50) {
                this.logger.log(`Connection pool utilization: ${metrics.utilizationPercentage}%`, 'DatabaseMonitorService', {
                    activeConnections: metrics.activeConnections,
                    idleConnections: metrics.idleConnections,
                });
            }

            // Alert if connections are maxed out
            if (metrics.activeConnections >= this.maxConnections) {
                this.logger.error('Connection pool is at maximum capacity!', undefined, 'DatabaseMonitorService', undefined, {
                    activeConnections: metrics.activeConnections,
                    maxConnections: this.maxConnections,
                });
            }
        } catch (error) {
            this.logger.error('Failed to monitor connection pool', error, 'DatabaseMonitorService');
        }
    }

    /**
     * Monitor slow queries every 10 minutes
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async monitorSlowQueries() {
        try {
            const slowQueries = await this.getSlowQueriesAnalysis();

            // If no slow queries analysis is available, log once and skip
            if (slowQueries.length === 0) {
                this.logger.debug('No slow queries found or analysis unavailable', 'DatabaseMonitorService');
                return;
            }

            // Log high impact slow queries
            const highImpactQueries = slowQueries.filter(q => q.impact === 'high');

            if (highImpactQueries.length > 0) {
                this.logger.warn(`Found ${highImpactQueries.length} high-impact slow queries`, 'DatabaseMonitorService', {
                    queries: highImpactQueries.map(q => ({
                        meanTime: q.meanTime,
                        calls: q.calls,
                        impact: q.impact,
                    })),
                });
            }

            // Log medium impact queries periodically
            const mediumImpactQueries = slowQueries.filter(q => q.impact === 'medium');

            if (mediumImpactQueries.length > 0) {
                this.logger.log(`Found ${mediumImpactQueries.length} medium-impact slow queries`, 'DatabaseMonitorService', {
                    queries: mediumImpactQueries.map(q => ({
                        meanTime: q.meanTime,
                        calls: q.calls,
                    })),
                });
            }
        } catch (error) {
            // Log as warning since slow query monitoring is non-critical
            this.logger.warn('Slow query monitoring failed', 'DatabaseMonitorService', {
                error: error.message,
                code: error.code,
            });
        }
    }

    /**
     * Health check for database connectivity
     */
    async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
        try {
            const isHealthy = await this.prisma.healthCheck();

            if (!isHealthy) {
                return {
                    status: 'unhealthy',
                    details: { message: 'Database health check failed' },
                };
            }

            const poolStatus = await this.getConnectionPoolStatus();

            return {
                status: 'healthy',
                details: {
                    connectionPool: poolStatus,
                    maxConnections: this.maxConnections,
                    slowQueryThreshold: this.slowQueryThreshold,
                },
            };
        } catch (error) {
            this.logger.error('Database health check failed', error, 'DatabaseMonitorService');
            return {
                status: 'unhealthy',
                details: { error: error.message },
            };
        }
    }

    /**
     * Get database performance metrics
     */
    async getPerformanceMetrics() {
        try {
            const [poolStatus, slowQueries] = await Promise.all([
                this.getConnectionPoolStatus(),
                this.getSlowQueriesAnalysis(),
            ]);

            return {
                connectionPool: poolStatus,
                slowQueries: {
                    total: slowQueries.length,
                    highImpact: slowQueries.filter(q => q.impact === 'high').length,
                    mediumImpact: slowQueries.filter(q => q.impact === 'medium').length,
                    lowImpact: slowQueries.filter(q => q.impact === 'low').length,
                    queries: slowQueries.slice(0, 5), // Top 5 slow queries
                },
                configuration: {
                    maxConnections: this.maxConnections,
                    slowQueryThreshold: this.slowQueryThreshold,
                },
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error('Failed to get performance metrics', error, 'DatabaseMonitorService');
            throw error;
        }
    }
} 