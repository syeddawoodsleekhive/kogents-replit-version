import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../../queue.module';
import { WorkspaceModule } from '../../workspace/workspace.module';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { SecureRedisCache } from '../../common/services/secure-redis-cache.service';
import { SecureIdService } from '../../common/services/secure-id.service';
import { AuthService } from '../auth.service';
import { WidgetService } from 'src/widget/widget.service';

@Module({
    imports: [
        PrismaModule,
        QueueModule,
        WorkspaceModule,
    ],
    controllers: [VerifyController],
    providers: [
        VerifyService,
        AuthService,
        AppLoggerService,
        SecureRedisCache,
        SecureIdService,
        WidgetService,
    ],
    exports: [VerifyService],
})
export class VerifyModule { } 