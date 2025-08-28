export default () => ({
  server: {
    port: parseInt(process.env.SERVER_PORT || '7001', 10),
  },
  maxmind: {
    countryDbPath: process.env.MAXMIND_COUNTRY_DB,
    cityDbPath: process.env.MAXMIND_CITY_DB,
    asnDbPath: process.env.MAXMIND_ASN_DB
  },
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '7001', 10),
    aiSocketUrl: process.env.AI_WEBSOCKET_URL,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://dashboard.autobotx.ai',
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
      'http://localhost:3010',
      '*'
    ],
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@kogents.com',
    replyTo: process.env.EMAIL_REPLY_TO,
  },
  verification: {
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    minResendIntervalMinutes: parseInt(process.env.OTP_MIN_RESEND_INTERVAL_MINUTES || '2', 10),
    maxResends: parseInt(process.env.OTP_MAX_RESENDS || '3', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
    slowQueryThreshold: parseInt(process.env.DATABASE_SLOW_QUERY_THRESHOLD || '1000', 10),
    poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '20', 10),
    idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10', 10),
  },
  databaseUrl: process.env.DATABASE_URL,
  dashboardUrl: process.env.DASHBOARD_URL
});