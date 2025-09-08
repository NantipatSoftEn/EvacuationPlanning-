import { Injectable } from '@nestjs/common';
import { AppConfig } from '../interfaces/config.interface';

@Injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        database: parseInt(process.env.REDIS_DB || '0', 10),
        ttl: parseInt(process.env.REDIS_TTL || '300', 10),
        tls: process.env.REDIS_TLS === 'true',
      },
      
      security: {
        jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
        apiKey: process.env.API_KEY || 'default_api_key',
      },
      
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs/app.log',
      },
      
      rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
      
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: process.env.CORS_CREDENTIALS === 'true',
      },
      
      swagger: {
        enabled: process.env.SWAGGER_ENABLED !== 'false',
        path: process.env.SWAGGER_PATH || 'docs',
      },
      
      healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
        endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
      },
      
      performance: {
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
      },
      
      cache: {
        ttl: parseInt(process.env.CACHE_TTL || '300', 10),
        distanceCacheTtl: parseInt(process.env.DISTANCE_CACHE_TTL || '86400', 10),
      },
    };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return this.config;
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}
