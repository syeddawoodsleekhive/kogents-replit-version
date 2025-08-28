import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';

import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue.module';
import { AppLoggerService } from 'src/common';

@Module({
    imports: [
        PrismaModule,
        QueueModule
    ],
    controllers: [
        WidgetController,
    ],
    providers: [
        WidgetService,
        AppLoggerService
    ],
    exports: [
        WidgetService,
    ],
})
export class WidgetModule { } 