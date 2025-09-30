import {
    ApiBodyOptions,
    ApiOperationOptions,
    ApiResponseOptions,
} from '@nestjs/swagger';

export const EvacuationSwaggerConfig = {
    generateEvacuationPlan: {
        operation: {
            summary: 'Generate evacuation plan',
            description:
                'Generate an optimized evacuation plan using specified strategy (greedy or weighted)',
        } as ApiOperationOptions,

        body: {
            description: 'Evacuation plan request parameters',
            examples: {
                greedy: {
                    summary: 'Greedy strategy with basic parameters',
                    value: {
                        strategy: 'greedy',
                        maxDistanceKm: 50,
                        allowMultiVehicle: true,
                        preferFewerTrips: true,
                        speedFallbackKmh: 40,
                    },
                },
                weighted: {
                    summary: 'Weighted strategy with advanced parameters',
                    value: {
                        strategy: 'weighted',
                        maxDistanceKm: 100,
                        allowMultiVehicle: true,
                        preferFewerTrips: false,
                        speedFallbackKmh: 45,
                    },
                },
            },
        } as ApiBodyOptions,

        responses: {
            success: {
                status: 201,
                description: 'Evacuation plan generated successfully',
            } as ApiResponseOptions,
            badRequest: {
                status: 400,
                description: 'Invalid input parameters',
            } as ApiResponseOptions,
            rateLimit: {
                status: 429,
                description: 'Rate limit exceeded',
            } as ApiResponseOptions,
        },
    },

    getEvacuationStatus: {
        operation: {
            summary: 'Get evacuation status',
            description: 'Retrieve current evacuation status for all zones',
        } as ApiOperationOptions,

        responses: {
            success: {
                status: 200,
                description: 'Evacuation status retrieved successfully',
            } as ApiResponseOptions,
        },
    },

    updateEvacuationStatus: {
        operation: {
            summary: 'Update evacuation status',
            description: 'Update the evacuation progress for a specific zone',
        } as ApiOperationOptions,

        body: {
            description: 'Evacuation update parameters',
            examples: {
                'by-id': {
                    summary: 'Update by zone ID',
                    value: {
                        id: 'zone-001',
                        vehicleId: 'v-001',
                    },
                },
                'by-location': {
                    summary: 'Update by zone location',
                    value: {
                        zoneLocation: '13.7563,100.5018',
                        vehicleId: 'v-002',
                    },
                },
            },
        } as ApiBodyOptions,

        responses: {
            success: {
                status: 200,
                description: 'Evacuation status updated successfully',
            } as ApiResponseOptions,
            badRequest: {
                status: 400,
                description: 'Invalid input data',
            } as ApiResponseOptions,
            notFound: {
                status: 404,
                description: 'Zone not found',
            } as ApiResponseOptions,
        },
    },

    clearEvacuationPlans: {
        operation: {
            summary: 'Clear all evacuation plans',
            description: 'Clear all evacuation plans and cache data',
        } as ApiOperationOptions,

        responses: {
            success: {
                status: 200,
                description:
                    'All evacuation plans and cache cleared successfully',
            } as ApiResponseOptions,
        },
    },

    getStats: {
        operation: {
            summary: 'Get system statistics',
            description:
                'Retrieve daily statistics, strategy usage, and cache information',
        } as ApiOperationOptions,

        responses: {
            success: {
                status: 200,
                description: 'Statistics retrieved successfully',
            } as ApiResponseOptions,
            rateLimit: {
                status: 429,
                description: 'Rate limit exceeded',
            } as ApiResponseOptions,
        },
    },
};
