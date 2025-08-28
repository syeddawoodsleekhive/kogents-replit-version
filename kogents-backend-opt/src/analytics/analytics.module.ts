import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { MarketingAttributionService } from './services/marketing-attribution.service';
import { RegistrationSessionsService } from './services/registration-sessions.service';
import { SecurityEventsService } from './services/security-events.service';
import { UserInteractionsService } from './services/user-interactions.service';
import { RegistrationSessionsController } from './controllers/registration-sessions.controller';
import { MarketingAttributionController } from './controllers/marketing-attribution.controller';
import { SecurityEventsController } from './controllers/security-events.controller';
import { UserInteractionsController } from './controllers/user-interactions.controller';
import { SecureIdService } from 'src/common';

@Module({
    imports: [
        PrismaModule,
        QueueModule,
    ],
    controllers: [
        RegistrationSessionsController,
        MarketingAttributionController,
        SecurityEventsController,
        UserInteractionsController,
    ],
    providers: [
        AppLoggerService,
        MarketingAttributionService,
        RegistrationSessionsService,
        SecurityEventsService,
        UserInteractionsService,
        SecureIdService
    ],
    exports: [
        MarketingAttributionService,
        RegistrationSessionsService,
        SecurityEventsService,
        UserInteractionsService,
        SecureIdService
    ],
})
export class AnalyticsModule { } 