import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
    imports: [
        PrismaModule,
        QueueModule,
    ],
    controllers: [TagsController],
    providers: [
        TagsService,
        AppLoggerService,
    ],
    exports: [TagsService],
})
export class TagsModule { }
