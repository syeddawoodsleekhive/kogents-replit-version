import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from 'src/queue.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { SecureRedisCache } from '../common/services/secure-redis-cache.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, AppLoggerService, SecureRedisCache, PermissionsGuard],
  exports: [WorkspaceService], // Export for AuthModule to use
})
export class WorkspaceModule { }