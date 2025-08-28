import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseMonitorService } from './database-monitor.service';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Global()
@Module({
    providers: [PrismaService, DatabaseMonitorService, AppLoggerService],
    exports: [PrismaService, DatabaseMonitorService],
})
export class PrismaModule { }
