/**
 * Common response interfaces for consistent API responses
 */

export interface ApiResponse<T = any> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  count: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ErrorResponse {
  message: string;
  error?: string;
  statusCode: number;
  timestamp?: string;
}

export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
}
