import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { PermissionsGuard } from '../common/guards';

@Module({
    imports: [PrismaModule],
    controllers: [UsersController],
    providers: [
        UsersService,
        AppLoggerService,
        PermissionsGuard,
    ],
    exports: [UsersService],
})
export class UsersModule { } 