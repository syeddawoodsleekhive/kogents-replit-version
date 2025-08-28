import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [RolesController],
    providers: [RolesService, AppLoggerService, PermissionsGuard],
    exports: [RolesService],
})
export class RolesModule { } 