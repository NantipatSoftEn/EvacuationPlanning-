export interface AppConfig {
  nodeEnv: string;
  port: number;
  appUrl: string;
  baseUrl: string;
  
  redis: {
    host: string;
    port: number;
    password: string;
    database: number;
    ttl: number;
    tls: boolean;
  };
  
  security: {
    jwtSecret: string;
    apiKey: string;
  };
  
  logging: {
    level: string;
    filePath: string;
  };
  
  rateLimit: {
    ttl: number;
    max: number;
  };
  
  cors: {
    origin: string;
    credentials: boolean;
  };
  
  swagger: {
    enabled: boolean;
    path: string;
  };
  
  healthCheck: {
    enabled: boolean;
    endpoint: string;
    timeout: number;
  };
  
  performance: {
    maxRequestSize: string;
    requestTimeout: number;
  };
  
  cache: {
    ttl: number;
    distanceCacheTtl: number;
  };
}
