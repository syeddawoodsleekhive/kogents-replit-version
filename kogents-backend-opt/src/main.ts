import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { AppLoggerService } from './common/logger/app-logger.service';
import { BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const expressApp = app as unknown as NestExpressApplication;
  expressApp.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Enhanced validation with proper error handling
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unallowed properties
      forbidNonWhitelisted: true, // throws error for unknown properties
      transform: true, // auto-transforms payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: false, // prevents implicit type conversion
      },
      disableErrorMessages: false, // always show detailed validation errors
      stopAtFirstError: false, // show all validation errors
      exceptionFactory: (errors) => {
        // This will be caught by ValidationExceptionFilter
        return new BadRequestException(errors);
      },
    }),
  );

  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const logger = await app.resolve(AppLoggerService);

  // Register exception filters in order of specificity
  app.useGlobalFilters(
    new ValidationExceptionFilter(logger), // Handle validation errors first
    new GlobalExceptionFilter(logger)     // Handle all other errors
  );

  // Enhanced CORS configuration with better preflight handling
  const corsOrigins = configService.get('cors.allowedOrigins') || [
    'https://dashboard.autobotx.ai',
    'https://widget-mediater.autobotx.ai',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:3008',
    'http://localhost:3009',
    'http://localhost:3010'
  ];

  // Add CORS middleware before other middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        res.header('Access-Control-Allow-Origin', '*');
      } else if (corsOrigins.includes(origin) || corsOrigins.includes('*') || origin.startsWith('http://localhost:')) {
        res.header('Access-Control-Allow-Origin', origin);
      }

      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-Client-Version, X-Platform, X-Device-ID, Cache-Control, Pragma, Expires, X-Idempotency-Key, Idempotency-Key, X-Chunk-Idempotency-Key, Chunk-Idempotency-Key'
      );
      res.header('Access-Control-Max-Age', '86400');

      return res.status(204).end();
    }

    // Handle regular requests
    if (origin) {
      if (corsOrigins.includes(origin) || corsOrigins.includes('*') || origin.startsWith('http://localhost:')) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    }
    res.header('Access-Control-Allow-Credentials', 'true');

    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        return callback(null, true);
      }

      // For development, allow all localhost origins
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Client-Version',
      'X-Platform',
      'X-Device-ID',
      'Cache-Control',
      'Pragma',
      'Expires',
      'X-Idempotency-Key',
      'Idempotency-Key',
      'X-Chunk-Idempotency-Key',
      'Chunk-Idempotency-Key',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page',
      'X-Per-Page',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  const serverPort = configService.get<number>('server.port') || 7001;

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Kogents Chat API')
    .setDescription('Backend API for Kogents Chat Application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for references
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
      description: 'Refresh token for authentication',
    })
    .build();

  // Secret password protection for Swagger docs
  const secretPassword = 'kogents_chat_secret'; // You can change this password
  const docsPath = 'api-docs';

  // Create the Swagger document
  const document = SwaggerModule.createDocument(app, config);

  // Set up protected Swagger documentation
  SwaggerModule.setup(`${docsPath}/${secretPassword}`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Kogents Chat API Documentation',
  });

  // Block access to unprotected docs
  app.use(`/${docsPath}`, (req, res) => {
    if (!req.url.includes(`/${secretPassword}`)) {
      res.status(401).send(`
        <html>
          <head><title>Access Denied</title></head>
          <body>
            <h1>Access Denied</h1>
          </body>
        </html>
      `);
    }
  });

  await app.listen(serverPort);

  // Workers are automatically started by the QueueModule when providers are instantiated
  // Verify all workers are loaded from DI container
  try {
    const workers = [
      'REGISTRATION_SESSIONS_WORKER',
      'MARKETING_ATTRIBUTION_WORKER',
      'SECURITY_EVENTS_WORKER',
      'USER_INTERACTIONS_WORKER',
      'CHAT_ANALYTICS_WORKER',
      'CHAT_NOTIFICATIONS_WORKER',
      'WORKSPACE_SETUP_WORKER',
      'EMAIL_WORKER',
      'FILE_PROCESSING_WORKER'
    ];

    const loadedWorkers = workers.map(workerToken => {
      try {
        const worker = app.get(workerToken);
        logger.log(`✅ ${workerToken} loaded and running`, 'Bootstrap');
        return workerToken;
      } catch (error) {
        logger.error(`❌ Failed to load ${workerToken}: ${error.message}`, 'Bootstrap');
        return null;
      }
    }).filter(Boolean);

    logger.log(`🔧 ${loadedWorkers.length}/${workers.length} workers successfully loaded`, 'Bootstrap');
  } catch (error) {
    logger.error(`Worker verification failed: ${error.message}`, 'Bootstrap');
  }

  logger.log(`🚀 Server is running on http://localhost:${serverPort}`, 'Bootstrap');
  logger.log(`📚 API Documentation available at http://localhost:${serverPort}/api-docs/${secretPassword}`, 'Bootstrap');
  logger.log(`🔒 Security headers enabled`, 'Bootstrap');
  logger.log(`🛡️  Enhanced validation with proper error handling enabled`, 'Bootstrap');
}

bootstrap();
