import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ValidationExceptionFilter } from './../src/common/filters/validation-exception.filter';
import { GlobalExceptionFilter } from './../src/common/filters/http-exception.filter';
import { AppLoggerService } from './../src/common/logger/app-logger.service';

describe('Validation Error Handling (e2e)', () => {
    let app: INestApplication;
    let logger: AppLoggerService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Get logger instance
        logger = moduleFixture.get<AppLoggerService>(AppLoggerService);

        // Set up validation pipe
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                disableErrorMessages: false,
                stopAtFirstError: false,
            }),
        );

        // Set up exception filters
        app.useGlobalFilters(
            new ValidationExceptionFilter(logger),
            new GlobalExceptionFilter(logger)
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/signup', () => {
        it('should return proper validation error for missing required fields', () => {
            return request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    // Missing required fields
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body).toHaveProperty('statusCode', 400);
                    expect(res.body).toHaveProperty('message', 'Validation failed');
                    expect(res.body).toHaveProperty('errors');
                    expect(Array.isArray(res.body.errors)).toBe(true);
                    expect(res.body.errors.length).toBeGreaterThan(0);

                    // Check for specific validation errors
                    const errorFields = res.body.errors.map((error: any) => error.field);
                    expect(errorFields).toContain('email');
                    expect(errorFields).toContain('name');
                });
        });

        it('should return proper validation error for invalid email format', () => {
            return request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    email: 'invalid-email',
                    name: 'Test User',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body).toHaveProperty('statusCode', 400);
                    expect(res.body).toHaveProperty('message', 'Validation failed');
                    expect(res.body).toHaveProperty('errors');

                    const emailError = res.body.errors.find((error: any) => error.field === 'email');
                    expect(emailError).toBeDefined();
                    expect(emailError.code).toBe('INVALID_EMAIL');
                });
        });

        it('should return proper validation error for unknown properties', () => {
            return request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    email: 'test@example.com',
                    name: 'Test User',
                    unknownField: 'should be rejected',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body).toHaveProperty('statusCode', 400);
                    expect(res.body).toHaveProperty('message', 'Validation failed');
                });
        });
    });

    describe('POST /auth/login', () => {
        it('should return proper validation error for missing credentials', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    // Missing required fields
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body).toHaveProperty('statusCode', 400);
                    expect(res.body).toHaveProperty('message', 'Validation failed');
                    expect(res.body).toHaveProperty('errors');

                    const errorFields = res.body.errors.map((error: any) => error.field);
                    expect(errorFields).toContain('email');
                    expect(errorFields).toContain('password');
                });
        });

        it('should return proper validation error for invalid email in login', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body).toHaveProperty('statusCode', 400);
                    expect(res.body).toHaveProperty('message', 'Validation failed');

                    const emailError = res.body.errors.find((error: any) => error.field === 'email');
                    expect(emailError).toBeDefined();
                    expect(emailError.code).toBe('INVALID_EMAIL');
                });
        });
    });
}); 