import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(
        private configService: ConfigService,
        private readonly logger: AppLoggerService
    ) {
        super({
            datasources: {
                db: {
                    url: configService.get('database.url'),
                },
            },
            // Connection pooling configuration
            log: configService.get('NODE_ENV') === 'development'
                ? ['query', 'error', 'warn']
                : ['error', 'warn'],
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Database connection established successfully', 'PrismaService');

            // Test connection and log pool status
            await this.testConnection();
        } catch (error) {
            this.logger.error('Failed to connect to database', error, 'PrismaService');
            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('Database connection closed successfully', 'PrismaService');
        } catch (error) {
            this.logger.error('Error closing database connection', error, 'PrismaService');
        }
    }

    private async testConnection(): Promise<void> {
        try {
            // Simple query to test connection
            await this.$queryRaw`SELECT 1`;
            this.logger.log('Database connection test successful', 'PrismaService');
        } catch (error) {
            this.logger.error('Database connection test failed', error, 'PrismaService');
            throw error;
        }
    }

    // Method to get connection pool status (for monitoring)
    async getConnectionPoolStatus(): Promise<any> {
        try {
            // This is a PostgreSQL-specific query to get connection pool info
            const result = await this.$queryRaw<Array<{
                total_connections: number;
                active_connections: number;
                idle_connections: number;
                idle_in_transaction: number;
            }>>`
                SELECT 
                    count(*) as total_connections,
                    count(*) FILTER (WHERE state = 'active') as active_connections,
                    count(*) FILTER (WHERE state = 'idle') as idle_connections,
                    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
                FROM pg_stat_activity 
                WHERE datname = current_database()
            `;

            return result[0];
        } catch (error) {
            this.logger.error('Failed to get connection pool status', error, 'PrismaService');
            return null;
        }
    }

    // Method to monitor slow queries
    async getSlowQueries(thresholdMs: number = 1000): Promise<any[]> {
        try {
            // Try PostgreSQL 13+ column names first (total_exec_time, mean_exec_time)
            try {
                const result = await this.$queryRaw<Array<{
                    query: string;
                    calls: number;
                    total_time: number;
                    mean_time: number;
                    rows: number;
                }>>`
                    SELECT 
                        query,
                        calls,
                        total_exec_time as total_time,
                        mean_exec_time as mean_time,
                        rows
                    FROM pg_stat_statements 
                    WHERE mean_exec_time > ${thresholdMs}
                    ORDER BY mean_exec_time DESC
                    LIMIT 10
                `;

                return result;
            } catch (versionError) {
                // If that fails, try older PostgreSQL column names (total_time, mean_time)
                if (versionError.code === '42703') {
                    const result = await this.$queryRaw<Array<{
                        query: string;
                        calls: number;
                        total_time: number;
                        mean_time: number;
                        rows: number;
                    }>>`
                        SELECT 
                            query,
                            calls,
                            total_time,
                            mean_time,
                            rows
                        FROM pg_stat_statements 
                        WHERE mean_time > ${thresholdMs}
                        ORDER BY mean_time DESC
                        LIMIT 10
                    `;

                    return result;
                }
                throw versionError;
            }
        } catch (error) {
            // Gracefully handle missing pg_stat_statements extension
            if (error.code === '42P01') {
                this.logger.warn('pg_stat_statements extension is not enabled in the database. Slow query analysis is unavailable.', 'PrismaService');
                return [];
            }
            this.logger.error('Failed to get slow queries', error, 'PrismaService');
            return [];
        }
    }

    // Health check method
    async healthCheck(): Promise<boolean> {
        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            this.logger.error('Database health check failed', error, 'PrismaService');
            return false;
        }
    }
}
