import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Module({
    imports: [PrismaModule],
    controllers: [PermissionsController],
    providers: [PermissionsService, AppLoggerService],
    exports: [PermissionsService],
})
export class PermissionsModule { } 