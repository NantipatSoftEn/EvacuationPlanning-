import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const HealthSwaggerDocs = {
    checkHealth: () =>
        applyDecorators(
            ApiOperation({
                summary: 'Health check',
                description: 'Check the health status of the API and its dependencies (Redis)',
            }),
            ApiResponse({
                status: 200,
                description: 'Service health check successful',
                schema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Service is healthy and running',
                        },
                        data: {
                            type: 'object',
                            properties: {
                                status: {
                                    type: 'string',
                                    example: 'ok',
                                },
                                timestamp: {
                                    type: 'string',
                                    example: '2025-09-09T10:30:00.000Z',
                                },
                                service: {
                                    type: 'string',
                                    example: 'Evacuation Planning API',
                                },
                                version: {
                                    type: 'string',
                                    example: '1.0.0',
                                },
                                uptime: {
                                    type: 'number',
                                    example: 3600,
                                },
                                services: {
                                    type: 'object',
                                    properties: {
                                        api: {
                                            type: 'object',
                                            properties: {
                                                status: {
                                                    type: 'string',
                                                    example: 'up',
                                                },
                                                responseTime: {
                                                    type: 'number',
                                                    example: 5,
                                                },
                                            },
                                        },
                                        redis: {
                                            type: 'object',
                                            properties: {
                                                status: {
                                                    type: 'string',
                                                    example: 'up',
                                                },
                                                connected: {
                                                    type: 'boolean',
                                                    example: true,
                                                },
                                                latency: { type: 'number', example: 2 },
                                            },
                                        },
                                    },
                                },
                                environment: {
                                    type: 'string',
                                    example: 'development',
                                },
                            },
                        },
                    },
                },
            }),
        ),
};