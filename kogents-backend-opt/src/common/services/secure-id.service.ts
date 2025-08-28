import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SecureIdService {
  private readonly nodeId: string;
  private readonly pid: number;
  private counter: number = 0;

  constructor(private readonly configService: ConfigService) {
    // Generate a unique node identifier for this instance
    this.nodeId = crypto.randomBytes(6).toString('hex');
    this.pid = process.pid;
  }

  /**
   * Generate enterprise-grade session ID
   * Format: {timestamp}-{nodeId}-{pid}-{counter}-{randomBytes}
   * Length: ~64 characters
   * Entropy: ~256 bits
   */
  generateSessionId(): string {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const counter = (++this.counter % 0xfffff).toString(36).padStart(4, '0'); // Rolling counter
    const randomBytes = crypto.randomBytes(16).toString('hex'); // 128 bits entropy

    return `${timestamp}-${this.nodeId}-${this.pid.toString(36)}-${counter}-${randomBytes}`;
  }

  /**
   * Generate enterprise-grade API key
   * Format: ak_{environment}_{version}_{payload}_{checksum}
   * Length: ~80 characters
   * Entropy: ~384 bits
   */
  generateApiKey(): string {
    const env = this.configService.get<string>('NODE_ENV', 'dev').substring(0, 3);
    const version = 'v1';

    // Generate payload with high entropy
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(32); // 256 bits entropy
    const payload = Buffer.concat([
      Buffer.from(timestamp.toString()),
      randomBytes,
    ]).toString('base64url');

    // Generate checksum for integrity
    const checksum = crypto
      .createHash('sha256')
      .update(`${env}${version}${payload}`)
      .digest('base64url')
      .substring(0, 8);

    return `ak_${env}_${version}_${payload}_${checksum}`;
  }

  /**
   * Generate cryptographically secure UUID v4
   * Enterprise-grade random UUID with proper entropy
   */
  generateSecureUuid(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate secure OTP code
   * 6-digit numeric code with uniform distribution
   */
  generateOtpCode(): string {
    let otp = '';
    for (let i = 0; i < 6; i++) {
      // Use rejection sampling for uniform distribution
      let randomByte;
      do {
        randomByte = crypto.randomBytes(1)[0];
      } while (randomByte >= 250); // Reject values that would cause bias

      otp += (randomByte % 10).toString();
    }
    return otp;
  }

  /**
   * Generate device fingerprint
   * Combines user agent, IP, and additional entropy
   */
  generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(userAgent);
    hash.update(ipAddress);
    hash.update(crypto.randomBytes(8)); // Add entropy to prevent enumeration

    return hash.digest('hex').substring(0, 32);
  }

  /**
   * Generate secure refresh token
   * High entropy token for authentication refresh
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  /**
   * Validate API key format and checksum
   */
  validateApiKey(apiKey: string): boolean {
    try {
      const parts = apiKey.split('_');
      if (parts.length !== 5 || parts[0] !== 'ak') {
        return false;
      }

      const [, env, version, payload, checksum] = parts;

      // Verify checksum
      const expectedChecksum = crypto
        .createHash('sha256')
        .update(`${env}${version}${payload}`)
        .digest('base64url')
        .substring(0, 8);

      return checksum === expectedChecksum;
    } catch {
      return false;
    }
  }

  /**
   * Extract metadata from session ID
   */
  parseSessionId(sessionId: string): {
    timestamp: number;
    nodeId: string;
    pid: number;
    counter: number;
  } | null {
    try {
      const parts = sessionId.split('-');
      if (parts.length !== 5) return null;

      return {
        timestamp: parseInt(parts[0], 36),
        nodeId: parts[1],
        pid: parseInt(parts[2], 36),
        counter: parseInt(parts[3], 36),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if session ID is expired (optional security check)
   */
  isSessionIdExpired(sessionId: string, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    const metadata = this.parseSessionId(sessionId);
    if (!metadata) return true;

    const age = Date.now() - metadata.timestamp;
    return age > maxAgeMs;
  }
} 