import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { VisitorController } from './controllers/visitor.controller';
import { ChatService } from './services/chat.service';
import { AgentService } from './services/agent.service';
import { VisitorService } from './services/visitor.service';
import { AnalyticsService } from './services/analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { SecureIdService } from '../common/services/secure-id.service';
import { SecureRedisCache } from '../common/services/secure-redis-cache.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from 'src/departments/services/departments.service';
import { MessageTrackingService } from './services/message-tracking.service';
import { ConnectionTrackingService } from './services/connection-tracking.service';
import { UploadsController } from './controllers/uploads.controller';
import { AiBridgeService } from './services/ai-bridge.service';
import { LocalStorageAdapter } from './services/local-storage.adapter';
import { UploadsService } from './services/uploads.service';
import { TagsService } from 'src/tags/tags.service';
import { ChatController } from './controllers/chat.controller';
import { CannedResponsesService } from 'src/canned-responses/canned-responses.service';

// Chat worker providers are now centralized in QueueModule

@Module({
    imports: [
        PrismaModule,
        QueueModule,
    ],
    controllers: [
        VisitorController,
        UploadsController,
        ChatController
    ],
    providers: [
        // Gateway
        ChatGateway,

        // Services
        ChatService,
        AgentService,
        VisitorService,
        AnalyticsService,
        MessageTrackingService,
        ConnectionTrackingService,
        SecureIdService,
        SecureRedisCache,
        AppLoggerService,
        WorkspaceService,
        UsersService,
        DepartmentsService,
        AiBridgeService,
        UploadsService,
        TagsService,
        CannedResponsesService,
        {
            provide: 'STORAGE_ADAPTER',
            useClass: LocalStorageAdapter,
        },
    ],
    exports: [
        ChatGateway,
        ChatService,
        AgentService,
        VisitorService,
        AnalyticsService,
        SecureIdService,
        WorkspaceService,
        DepartmentsService,
        UsersService,
        AiBridgeService,
        TagsService,
        CannedResponsesService,
    ],
})
export class ChatModule { } 