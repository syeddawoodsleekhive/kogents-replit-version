<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Kogents Chat Backend

A robust, production-ready chat backend built with NestJS, featuring comprehensive user session tracking, secure authentication, and workspace management.

## Features

### 🔐 Authentication & Security
- **JWT-based authentication** with refresh tokens
- **Redis-cached signup flow** with email verification
- **Rate limiting** and security guards
- **Device fingerprinting** and session tracking
- **Comprehensive user session management**

### 🏢 Workspace Management
- **Multi-tenant workspace system**
- **Role-based permissions**
- **Admin registration flow** with email verification
- **Workspace branding and customization**

### 📊 Analytics & Tracking
- **Comprehensive user session tracking** with 25+ data points
- **Geographic location tracking** (IP-based)
- **Device detection and fingerprinting**
- **Marketing attribution** (UTM parameters)
- **Activity metrics** (requests, pages, actions)
- **Session duration and analytics**

### 🚀 Performance & Scalability
- **Database connection pooling**
- **Redis caching** for sessions and tokens
- **Queue-based email processing**
- **Automated session cleanup**
- **Health monitoring endpoints**

## API Endpoints

### Authentication
- `POST /auth/signup` - Admin registration (Step 1)
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/resume` - Resume incomplete signup

### User Sessions
- `POST /auth/session` - Create comprehensive user session
- `GET /health/sessions` - Get user active sessions
- `DELETE /health/sessions/:token` - End user session

### Workspace Management
- `POST /workspace` - Create workspace for session
- `GET /health/workspaces` - Get workspace info

### Email Verification
- `POST /auth/verify/send-for-session` - Send OTP email
- `POST /auth/verify/confirm-for-session` - Verify OTP

### Health & Maintenance
- `GET /health` - Health check
- `GET /health/database` - Database health
- `GET /health/database/pool` - Connection pool status
- `GET /health/database/performance` - Performance metrics



## User Session Tracking

The system now supports comprehensive user session tracking with **25+ data points** automatically captured during login and signup flows.

### Required Fields (Auto-captured)
- `userId` - User identifier
- `workspaceId` - Workspace identifier  
- `sessionToken` - Unique session token
- `ipAddress` - Client IP address

### Optional Analytics Fields (Frontend-provided)
- **Geographic Data**: `countryCode`, `latitude`, `longitude`, `timezone`
- **Marketing Attribution**: `referrerUrl`, `landingPage`, `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent`

### Auto-Generated Fields
- **Device Information**: `deviceType`, `deviceName`, `deviceFingerprint` (parsed from User-Agent)
- **Activity Metrics**: `totalRequests`, `pagesVisited`, `actionsPerformed`, `sessionDurationSec` (defaults to 0)
- **Session Configuration**: `sessionType` (defaults to WEB), `isActive` (defaults to true)

### Example Usage

**Login with analytics data:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "countryCode": "US",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timezone": "America/New_York",
  "referrerUrl": "https://google.com",
  "landingPage": "https://app.example.com/dashboard",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "summer_sale_2024"
}
```

**Signup with analytics data:**
```bash
POST /auth/signup
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "SecurePassword123!",
  "countryCode": "US",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timezone": "America/New_York",
  "referrerUrl": "https://google.com",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "summer_sale_2024"
}
```

**All analytics fields are optional** - the system will work perfectly with just the basic login/signup data, but will capture rich analytics when provided by the frontend.

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kogents_chat"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENCRYPTION_KEY=your-encryption-key
REDIS_ENCRYPTION_SALT=your-encryption-salt

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App
NODE_ENV=development
PORT=3000
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kogents-chat-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the application**
   ```bash
   npm run start:dev
   ```

## Development

### Database Schema
The application uses Prisma with PostgreSQL and includes comprehensive models for:
- Users and authentication
- Workspaces and multi-tenancy
- User sessions with analytics
- Email verification
- Role-based permissions

### Key Services
- **AuthService**: Handles authentication, signup flow, and session management
- **SecureRedisCache**: Encrypted Redis caching for sensitive data
- **EmailProcessor**: Queue-based email processing
- **SessionCleanupService**: Automated session cleanup
- **WorkspaceService**: Workspace management

### Testing
```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Considerations

- **Security**: All sensitive data is encrypted in Redis
- **Performance**: Database connection pooling and Redis caching
- **Monitoring**: Comprehensive logging and health endpoints
- **Scalability**: Queue-based processing and session cleanup
- **Analytics**: Rich session tracking for user behavior analysis

## License

MIT License - see LICENSE file for details.
