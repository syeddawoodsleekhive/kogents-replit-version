import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { LoginDto } from './dtos/login.dto';
import { SignupDto } from './dtos/signup.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AppLoggerService } from '../common/logger/app-logger.service';
import {
  ResumeSignupDto,
} from './dtos/signup-session.dto';
import {
  ApiValidationError,
  ApiUnauthorizedError,
  ApiConflictError,
  ApiNotFoundError,
  ApiInternalServerError
} from '../common/decorators/api-error-response.decorator';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLoggerService,
  ) { }

  @Public()
  @Post('signup')
  @Throttle({ auth: { limit: 3, ttl: 15 * 60 * 1000 } }) // 3 per 15 minutes
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description: 'Start user registration process. Creates a Redis-cached session for the signup flow. Rate limited to prevent abuse.'
  })
  @ApiBody({
    type: SignupDto,
    description: 'User registration data'
  })
  @ApiOkResponse({
    description: 'Registration started successfully',
    schema: {
      type: 'object',
      properties: {
        step: { type: 'string', description: 'Current step in the signup process' },
        email: { type: 'string', description: 'User email address' },
        sessionId: { type: 'string', description: 'Unique session ID for this signup attempt' },
        expiresAt: { type: 'string', format: 'date-time', description: 'Session expiration time' }
      }
    }
  })
  @ApiValidationError()
  @ApiConflictError()
  @ApiTooManyRequestsResponse({
    description: 'Too many signup attempts'
  })
  @ApiInternalServerError()
  async signup(@Body() dto: SignupDto, @Res() res: Response) {
    this.logger.log(`Signup attempt: email=${dto.email}`, 'AuthController');

    const result = await this.authService.signup(dto);

    return res.status(HttpStatus.CREATED).json(result);
  }

  @Public()
  @Post('resume')
  @Throttle({ auth: { limit: 10, ttl: 15 * 60 * 1000 } }) // 10 per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume signup process',
    description: 'Resume an incomplete signup process using session ID. Returns current progress and remaining time.'
  })
  @ApiBody({
    type: ResumeSignupDto,
    description: 'Session ID to resume'
  })
  @ApiOkResponse({
    description: 'Signup session resumed successfully',
    schema: {
      type: 'object',
      properties: {
        step: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        },
        workspace: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' }
          },
          nullable: true
        },
        timeRemaining: { type: 'number', description: 'Seconds until session expires' }
      }
    }
  })
  @ApiValidationError()
  @ApiNotFoundError()
  @ApiTooManyRequestsResponse({
    description: 'Too many resume attempts'
  })
  @ApiInternalServerError()
  async resumeSignup(@Body() dto: ResumeSignupDto, @Res() res: Response) {
    this.logger.log(`Resume signup attempt for session: ${dto.sessionId}`, 'AuthController');

    const result = await this.authService.resumeSignup(dto.sessionId);

    return res.status(HttpStatus.OK).json(result);
  }

  @Public()
  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 15 * 60 * 1000 } }) // 5 per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return access token. Sets refresh token in HTTP-only cookie. Rate limited to prevent brute force attacks.'
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials'
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthResponseDto
  })
  @ApiValidationError()
  @ApiUnauthorizedError()
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts'
  })
  @ApiInternalServerError()
  async login(@Req() req: Request, @Body() dto: LoginDto, @Res() res: Response) {
    this.logger.log(`Login attempt: user=${dto.email}`, 'AuthController');

    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.refresh_token, result.user.id);
    return res.status(HttpStatus.OK).json({
      access_token: result.access_token,
      user: result.user,
      workspace: result.workspace
    });
  }

  @Public()
  @Post('refresh')
  @Throttle({ auth: { limit: 20, ttl: 15 * 60 * 1000 } }) // 20 per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refresh access token using refresh token from HTTP-only cookie.'
  })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    type: AuthResponseDto
  })
  @ApiUnauthorizedError()
  @ApiTooManyRequestsResponse({
    description: 'Too many refresh attempts'
  })
  @ApiInternalServerError()
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    const userId = req.cookies?.userId;

    if (!refreshToken || !userId) {
      this.logger.warn(`Token refresh attempt without valid cookies`, 'AuthController');
      throw new UnauthorizedException('No refresh token provided');
    }

    this.logger.log(`Token refresh attempt: user=${userId}`, 'AuthController');

    const result = await this.authService.refreshTokens(userId, refreshToken);
    this.setAuthCookies(res, result.refresh_token, userId);

    return res.status(HttpStatus.OK).json({
      access_token: result.access_token,
    });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user and clear cookies.'
  })
  @ApiOkResponse({
    description: 'Logout successful'
  })
  @ApiUnauthorizedError()
  @ApiInternalServerError()
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    const userId = req.cookies?.userId;

    if (!refreshToken || !userId) {
      this.logger.warn(`Logout attempt without valid cookies`, 'AuthController');
      throw new UnauthorizedException('No valid session found');
    }

    this.logger.log(`Logout attempt: user=${userId}`, 'AuthController');

    try {
      // Clear cookies
      res.clearCookie('refreshToken');
      res.clearCookie('userId');

      return res.status(HttpStatus.OK).json({
        message: 'Logout successful'
      });
    } catch (error) {
      this.logger.error(`Logout failed for user ${userId}:`, error);
      throw new UnauthorizedException('Logout failed');
    }
  }

  private setAuthCookies(res: Response, token: string, userId: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('userId', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}