import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseMonitorService } from '../prisma/database-monitor.service';
import { Public } from '../common/decorators/public.decorator';
import { ApiInternalServerError } from '../common/decorators/api-error-response.decorator';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
    constructor(
        private readonly databaseMonitor: DatabaseMonitorService,
    ) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'General health check' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    @ApiResponse({ status: 503, description: 'Service is unhealthy' })
    @ApiInternalServerError()
    async healthCheck() {
        const health = await this.databaseMonitor.healthCheck();
        return {
            status: health.status,
            timestamp: new Date().toISOString(),
            service: 'kogents-chat-backend',
            ...health.details,
        };
    }

    @Get('database')
    @Public()
    @ApiOperation({ summary: 'Database health check' })
    @ApiResponse({ status: 200, description: 'Database is healthy' })
    @ApiInternalServerError()
    async databaseHealth() {
        const health = await this.databaseMonitor.healthCheck();
        return {
            database: health,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('database/pool')
    @Public()
    @ApiOperation({ summary: 'Database connection pool status' })
    @ApiResponse({ status: 200, description: 'Connection pool status retrieved' })
    @ApiInternalServerError()
    async connectionPoolStatus() {
        const poolStatus = await this.databaseMonitor.getConnectionPoolStatus();
        return {
            connectionPool: poolStatus,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('database/performance')
    @Public()
    @ApiOperation({ summary: 'Database performance metrics' })
    @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
    @ApiInternalServerError()
    async databasePerformance() {
        const metrics = await this.databaseMonitor.getPerformanceMetrics();
        return {
            performance: metrics,
            timestamp: new Date().toISOString(),
        };
    }
} 