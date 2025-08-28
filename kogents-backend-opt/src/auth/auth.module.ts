import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceModule } from '../workspace/workspace.module';
import { VerifyModule } from './verify/verify.module';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { SecureIdService } from '../common/services/secure-id.service';
import { SecureRedisCache } from '../common/services/secure-redis-cache.service';
import { WidgetService } from 'src/widget/widget.service';
import { Redis } from 'ioredis';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    WorkspaceModule,
    VerifyModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenTtl'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    AppLoggerService,
    SecureIdService,
    SecureRedisCache,
    WidgetService,
    {
      provide: 'REDIS_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get('redis.host'),
          port: configService.get<number>('redis.port')
        });
        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule { }
