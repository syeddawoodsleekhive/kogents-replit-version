import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';
import {
  PendingUserData,
  PendingEmailVerification
} from '../types/pending-user.interface';
import { SignupStep } from '../../auth/dtos/signup-session.dto';
import { AppLoggerService } from '../logger/app-logger.service';

/**
 * SecureRedisCache - Encrypted Redis caching for sensitive data
 * 
 * SECURITY APPROACH:
 * - All sensitive data is encrypted using AES-256-GCM before storage
 * - Session-based signup flow prevents user hijacking of abandoned registrations
 * - Password reset and email verification use email as key (appropriate for those flows)
 * 
 * SIGNUP FLOW (Session-based):
 * - Each signup attempt gets a unique sessionId
 * - Pending user data is stored by sessionId, not email
 * - This prevents multiple users with same email from interfering with each other
 * - Use: setPendingUserBySession(), getPendingUserBySession(), etc.
 * 
 * PASSWORD RESET & EMAIL VERIFICATION (Email-based):
 * - These flows use email as the cache key (appropriate for these use cases)
 * - Use: setEmailVerification(), getEmailVerification(), setPasswordResetToken(), etc.
 * 
 * ENCRYPTION:
 * - Uses PBKDF2 for key derivation
 * - AES-256-GCM for authenticated encryption
 * - Additional authenticated data for extra security
 */
@Injectable()
export class SecureRedisCache {
  private readonly redis: Redis;
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationSalt: Buffer;

  // Redis key patterns
  private static readonly REDIS_KEYS = {
    PENDING_SIGNUP: (email: string) => `pending_signup:${email}`,
    PENDING_SIGNUP_SESSION: (sessionId: string) => `pending_signup_session:${sessionId}`,
    EMAIL_VERIFICATION: (email: string) => `email_verify:${email}`,
    PASSWORD_RESET_TOKEN: (token: string) => `password_reset:${token}`,
  };

  // TTL constants (in seconds)
  private static readonly TTL = {
    PENDING_SIGNUP: 24 * 60 * 60, // 24 hours
    PENDING_SIGNUP_SESSION: 24 * 60 * 60, // 24 hours
    EMAIL_VERIFICATION: 10 * 60, // 10 minutes
    PASSWORD_RESET_TOKEN: 60 * 60, // 1 hour
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host') || 'localhost',
      port: this.configService.get<number>('redis.port') || 6379,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Initialize encryption key
    const encryptionSecret = this.configService.get<string>('REDIS_ENCRYPTION_KEY');
    if (!encryptionSecret) {
      throw new Error('REDIS_ENCRYPTION_KEY environment variable is required');
    }

    // Derive encryption key using PBKDF2
    this.keyDerivationSalt = Buffer.from(
      this.configService.get<string>('REDIS_ENCRYPTION_SALT') || 'kogents-redis-salt',
      'utf8'
    );

    this.encryptionKey = crypto.pbkdf2Sync(
      encryptionSecret,
      this.keyDerivationSalt,
      100000, // iterations
      32, // key length
      'sha256'
    );

    this.setupRedisEventHandlers();
  }

  private setupRedisEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.log('Redis connection established for secure cache', 'SecureRedisCache');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error?.stack, 'SecureRedisCache', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed', 'SecureRedisCache');
    });
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(16); // 128-bit IV
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      cipher.setAAD(Buffer.from('kogents-auth', 'utf8')); // Additional authenticated data

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combine IV + AuthTag + Encrypted data
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error('Encryption failed:', error, 'SecureRedisCache');
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAAD(Buffer.from('kogents-auth', 'utf8'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error, 'SecureRedisCache');
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Store pending user data by session ID (new secure approach)
   */
  async setPendingUserBySession(sessionId: string, userData: PendingUserData): Promise<void> {
    try {
      const serializedData = JSON.stringify({
        ...userData,
        createdAt: userData.createdAt.toISOString(),
        lastUpdated: userData.lastUpdated.toISOString(),
        expiresAt: userData.expiresAt.toISOString(),
        emailVerification: userData.emailVerification ? {
          ...userData.emailVerification,
          lastSentAt: userData.emailVerification.lastSentAt.toISOString(),
          expiresAt: userData.emailVerification.expiresAt.toISOString(),
        } : undefined,
      });

      const encryptedData = this.encrypt(serializedData);
      const key = SecureRedisCache.REDIS_KEYS.PENDING_SIGNUP_SESSION(sessionId);

      await this.redis.setex(key, SecureRedisCache.TTL.PENDING_SIGNUP_SESSION, encryptedData);

      this.logger.debug(`Stored pending user data by session: ${sessionId}`, 'SecureRedisCache');
    } catch (error) {
      this.logger.error(`Failed to store pending user data by session ${sessionId}:`, error, 'SecureRedisCache');
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Retrieve pending user data by session ID
   */
  async getPendingUserBySession(sessionId: string): Promise<PendingUserData | null> {
    try {
      const key = SecureRedisCache.REDIS_KEYS.PENDING_SIGNUP_SESSION(sessionId);
      const encryptedData = await this.redis.get(key);

      if (!encryptedData) {
        this.logger.debug(`No pending user data found for session: ${sessionId}`, 'SecureRedisCache');
        return null;
      }

      const decryptedData = this.decrypt(encryptedData);
      const userData = JSON.parse(decryptedData);

      // Rehydrate dates
      return {
        ...userData,
        createdAt: new Date(userData.createdAt),
        lastUpdated: new Date(userData.lastUpdated),
        expiresAt: new Date(userData.expiresAt),
        emailVerification: userData.emailVerification ? {
          ...userData.emailVerification,
          lastSentAt: new Date(userData.emailVerification.lastSentAt),
          expiresAt: new Date(userData.emailVerification.expiresAt),
        } : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve pending user data for session ${sessionId}:`, error, 'SecureRedisCache');
      // Clean up corrupted data
      await this.deletePendingUserBySession(sessionId);
      return null;
    }
  }

  /**
   * Update pending user data by session ID
   */
  async updatePendingUserBySession(sessionId: string, updates: Partial<PendingUserData>): Promise<boolean> {
    try {
      const existingData = await this.getPendingUserBySession(sessionId);
      if (!existingData) {
        return false;
      }

      const updatedData = {
        ...existingData,
        ...updates,
        lastUpdated: new Date(),
      };

      await this.setPendingUserBySession(sessionId, updatedData);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update pending user data for session ${sessionId}:`, error, 'SecureRedisCache');
      return false;
    }
  }

  /**
   * Delete pending user data by session ID
   */
  async deletePendingUserBySession(sessionId: string): Promise<boolean> {
    try {
      const key = SecureRedisCache.REDIS_KEYS.PENDING_SIGNUP_SESSION(sessionId);
      const result = await this.redis.del(key);
      this.logger.debug(`Deleted pending user data for session: ${sessionId}`, 'SecureRedisCache');
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete pending user data for session ${sessionId}:`, error, 'SecureRedisCache');
      return false;
    }
  }

  /**
   * Store email verification data in Redis
   */
  async setEmailVerification(email: string, verification: PendingEmailVerification): Promise<void> {
    try {
      const serializedData = JSON.stringify({
        ...verification,
        lastSentAt: verification.lastSentAt.toISOString(),
        expiresAt: verification.expiresAt.toISOString(),
      });

      const encryptedData = this.encrypt(serializedData);
      const key = SecureRedisCache.REDIS_KEYS.EMAIL_VERIFICATION(email);

      await this.redis.setex(key, SecureRedisCache.TTL.EMAIL_VERIFICATION, encryptedData);

      this.logger.debug(`Stored email verification for: ${email}`, 'SecureRedisCache');
    } catch (error) {
      this.logger.error(`Failed to store email verification for ${email}:`, error, 'SecureRedisCache');
      throw new Error('Failed to store email verification');
    }
  }

  /**
   * Retrieve email verification data from Redis
   */
  async getEmailVerification(email: string): Promise<PendingEmailVerification | null> {
    try {
      const key = SecureRedisCache.REDIS_KEYS.EMAIL_VERIFICATION(email);
      const encryptedData = await this.redis.get(key);

      if (!encryptedData) {
        return null;
      }

      const decryptedData = this.decrypt(encryptedData);
      const verification = JSON.parse(decryptedData);

      return {
        ...verification,
        lastSentAt: new Date(verification.lastSentAt),
        expiresAt: new Date(verification.expiresAt),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve email verification for ${email}:`, error, 'SecureRedisCache');
      await this.deleteEmailVerification(email);
      return null;
    }
  }

  /**
   * Delete email verification data from Redis
   */
  async deleteEmailVerification(email: string): Promise<boolean> {
    try {
      const key = SecureRedisCache.REDIS_KEYS.EMAIL_VERIFICATION(email);
      const result = await this.redis.del(key);
      this.logger.debug(`Deleted email verification for: ${email}`, 'SecureRedisCache');
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete email verification for ${email}:`, error, 'SecureRedisCache');
      return false;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed:', error, 'SecureRedisCache');
      return false;
    }
  }

  /**
   * Store password reset token to email mapping
   */
  async setPasswordResetToken(token: string, email: string): Promise<void> {
    try {
      const encryptedEmail = this.encrypt(email);
      const key = SecureRedisCache.REDIS_KEYS.PASSWORD_RESET_TOKEN(token);

      await this.redis.setex(key, SecureRedisCache.TTL.PASSWORD_RESET_TOKEN, encryptedEmail);

      this.logger.debug(`Stored password reset token mapping for token: ${token}`, 'SecureRedisCache');
    } catch (error) {
      this.logger.error(`Failed to store password reset token mapping for token ${token}:`, error, 'SecureRedisCache');
      throw new Error('Failed to store password reset token');
    }
  }

  /**
   * Get email associated with password reset token
   */
  async getPasswordResetEmail(token: string): Promise<string | null> {
    try {
      const key = SecureRedisCache.REDIS_KEYS.PASSWORD_RESET_TOKEN(token);
      const encryptedEmail = await this.redis.get(key);

      if (!encryptedEmail) {
        this.logger.debug(`No password reset token mapping found for token: ${token}`, 'SecureRedisCache');
        return null;
      }

      const email = this.decrypt(encryptedEmail);
      return email;
    } catch (error) {
      this.logger.error(`Failed to retrieve password reset email for token ${token}:`, error, 'SecureRedisCache');
      // Clean up corrupted data
      await this.deletePasswordResetToken(token);
      return null;
    }
  }

  /**
   * Delete password reset token mapping
   */
  async deletePasswordResetToken(token: string): Promise<boolean> {
    try {
      const key = SecureRedisCache.REDIS_KEYS.PASSWORD_RESET_TOKEN(token);
      const result = await this.redis.del(key);

      this.logger.debug(`Deleted password reset token mapping for token: ${token}`, 'SecureRedisCache');
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete password reset token mapping for token ${token}:`, error, 'SecureRedisCache');
      return false;
    }
  }
} 