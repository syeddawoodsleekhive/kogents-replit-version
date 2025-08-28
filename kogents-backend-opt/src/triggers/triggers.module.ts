import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { TriggersService } from './triggers.service';
import { TriggersController } from './triggers.controller';
import { TriggersOrchestratorService } from './triggers-orchestrator.service';
import { SecureIdService } from 'src/common';
import { ChatModule } from 'src/chat/chat.module';

@Module({
    imports: [
        PrismaModule,
        QueueModule,
        ChatModule
    ],
    controllers: [TriggersController],
    providers: [
        TriggersService,
        AppLoggerService,
        TriggersOrchestratorService,
        SecureIdService,
    ],
    exports: [TriggersService, TriggersOrchestratorService, SecureIdService],
})
export class TriggersModule { }