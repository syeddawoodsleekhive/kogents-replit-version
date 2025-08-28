import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerRedisStorageService implements ThrottlerStorage {
    private redis: Redis;

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
    }

    async increment(key: string, ttl: number): Promise<{ totalHits: number; ttl: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
        const multi = this.redis.multi();
        const currentTime = Date.now();
        const windowStart = currentTime - ttl;

        // Add current timestamp to sorted set
        multi.zadd(key, currentTime, currentTime.toString());

        // Remove old entries outside the window
        multi.zremrangebyscore(key, 0, windowStart);

        // Count entries in the window
        multi.zcard(key);

        // Set expiry on the key
        multi.expire(key, Math.ceil(ttl / 1000));

        const results = await multi.exec();
        const totalHits = results?.[2]?.[1] as number || 0;

        return {
            totalHits,
            ttl,
            timeToExpire: ttl,
            isBlocked: false,
            timeToBlockExpire: 0
        };
    }

    async get(key: string): Promise<{ totalHits: number; ttl: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
        const currentTime = Date.now();
        const ttl = await this.redis.ttl(key);

        if (ttl <= 0) {
            return {
                totalHits: 0,
                ttl: 0,
                timeToExpire: 0,
                isBlocked: false,
                timeToBlockExpire: 0
            };
        }

        const totalHits = await this.redis.zcard(key);
        return {
            totalHits,
            ttl: ttl * 1000,
            timeToExpire: ttl * 1000,
            isBlocked: false,
            timeToBlockExpire: 0
        };
    }

    async reset(key: string): Promise<void> {
        await this.redis.del(key);
    }
} 