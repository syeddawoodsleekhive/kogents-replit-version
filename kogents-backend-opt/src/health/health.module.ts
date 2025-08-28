import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseMonitorService } from '../prisma/database-monitor.service';
import { SecureRedisCache } from '../common/services/secure-redis-cache.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Module({
    imports: [AuthModule, PrismaModule],
    controllers: [HealthController],
    providers: [
        DatabaseMonitorService,
        SecureRedisCache,
        AppLoggerService,
    ],
})
export class HealthModule { } 