import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { CannedResponsesController } from './canned-responses.controller';
import { CannedResponsesService } from './canned-responses.service';

@Module({
    imports: [
        PrismaModule,
        QueueModule,
    ],
    controllers: [CannedResponsesController],
    providers: [
        CannedResponsesService,
        AppLoggerService,
    ],
    exports: [CannedResponsesService],
})
export class CannedResponsesModule { }