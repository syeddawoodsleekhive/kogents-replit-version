import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { AppLoggerService } from './common/logger/app-logger.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { QueueModule } from './queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChatModule } from './chat/chat.module';
import { WidgetModule } from './widget/widget.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerRedisStorageService } from './common/services/throttler-redis-storage.service';
import { CannedResponsesModule } from './canned-responses/canned-responses.module';
import { TagsModule } from './tags/tags.module';
import { TriggersModule } from './triggers/triggers.module';
import { DepartmentsModule } from './departments/departments.module';
import { GeoIpModule } from './geoip/geoip.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.accessTokenTtl') },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          throttlers: [
            {
              ttl: 60000, // 1 minute
              limit: 60, // Reduced from 100 for better security
              name: 'general',
            },
            {
              ttl: 15 * 60 * 1000, // 15 minutes
              limit: 10, // Increased from 5 for auth operations
              name: 'auth',
            },
            {
              ttl: 60 * 60 * 1000, // 1 hour
              limit: 3,
              name: 'account_creation',
            },
            {
              ttl: 5 * 60 * 1000, // 5 minutes
              limit: 5,
              name: 'verification',
            },
            {
              ttl: 24 * 60 * 60 * 1000, // 24 hours
              limit: 10,
              name: 'password_reset',
            },
          ],
          storage: new ThrottlerRedisStorageService(),
        };
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    WorkspaceModule,
    DepartmentsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    QueueModule,
    AnalyticsModule,
    ChatModule,
    WidgetModule,
    HealthModule,
    CannedResponsesModule,
    TagsModule,
    TriggersModule,
    GeoIpModule
  ],
  providers: [
    AppLoggerService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
  ],
  exports: [AppLoggerService]
})
export class AppModule { }
