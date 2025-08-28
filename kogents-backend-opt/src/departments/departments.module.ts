import { Module } from '@nestjs/common';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentsService } from './services/departments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [DepartmentsController],
    providers: [
        DepartmentsService,
        AppLoggerService, // Provide AppLoggerService directly
    ],
    exports: [DepartmentsService],
})
export class DepartmentsModule { } 