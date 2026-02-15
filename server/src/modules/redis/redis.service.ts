import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const DEFAULT_TTL = 3600; // 1 hour

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  // ─── Lifecycle ──────────────────────────────────────────────

  async onModuleInit() {
    const url = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 500, 5000);
          return delay;
        },
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis connection error: ${err.message}`);
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected');
      });

      await this.client.connect();
    } catch (err) {
      this.logger.warn(
        `Redis unavailable -- caching disabled: ${(err as Error).message}`,
      );
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }

  // ─── Core Operations ───────────────────────────────────────

  /**
   * Get a cached value by key. Returns null on miss or Redis failure.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Redis GET failed for "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Set a cached value with TTL (default 1 hour).
   */
  async set(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
    if (!this.client) return;

    try {
      const raw = JSON.stringify(value);
      await this.client.set(key, raw, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Redis SET failed for "${key}": ${(err as Error).message}`);
    }
  }

  /**
   * Delete a single key.
   */
  async del(key: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Redis DEL failed for "${key}": ${(err as Error).message}`);
    }
  }

  /**
   * Delete all keys matching a glob pattern using SCAN + pipeline DEL.
   * Never uses KEYS command (blocks the server on large keyspaces).
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.client) return;

    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          const pipeline = this.client.pipeline();
          for (const key of keys) {
            pipeline.del(key);
          }
          await pipeline.exec();
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(
        `Redis SCAN+DEL failed for pattern "${pattern}": ${(err as Error).message}`,
      );
    }
  }

  /**
   * Check if Redis is connected and responsive.
   */
  async isHealthy(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
