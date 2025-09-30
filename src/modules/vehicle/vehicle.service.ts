import { Injectable, BadRequestException } from '@nestjs/common'
import { VehicleCreateDto } from './vehicle.dto'
import { mockVehicles } from '@common/mocks/vehicle'

export interface ProcessedVehicle {
    id: string
    vehicleId?: string
    capacity: number
    type: string
    locationCoordinates?: {
        latitude: number
        longitude: number
    }
    speed?: number
}

@Injectable()
export class VehicleService {
    private readonly vehicles: ProcessedVehicle[] = [...mockVehicles]

    addVehicle(vehicleData: VehicleCreateDto) {
        // Validate input data
        this.validateVehicleInput(vehicleData)

        const newVehicle: ProcessedVehicle = {
            id: vehicleData.vehicleId || Math.random().toString(36).substring(2, 11),
            capacity: vehicleData.capacity,
            type: vehicleData.type,
        }

        // Handle new format
        if (vehicleData.locationCoordinates) {
            newVehicle.vehicleId = vehicleData.vehicleId || newVehicle.id
            newVehicle.locationCoordinates = vehicleData.locationCoordinates
            newVehicle.speed = vehicleData.speed
        }

        this.vehicles.push(newVehicle)
        return newVehicle
    }

    addVehicles(vehiclesData: VehicleCreateDto[]): ProcessedVehicle[] {
        const results: ProcessedVehicle[] = []
        const errors: string[] = []

        vehiclesData.forEach((vehicleData, index) => {
            try {
                const result = this.addVehicle(vehicleData)
                results.push(result)
            } catch (error) {
                errors.push(`Vehicle ${index + 1}: ${error.message}`)
            }
        })

        if (errors.length > 0) {
            throw new BadRequestException(`Failed to add some vehicles: ${errors.join(', ')}`)
        }

        return results
    }

    private validateVehicleInput(vehicleData: VehicleCreateDto) {
        // Check if either new format or legacy format is provided
        const hasNewFormat = vehicleData.locationCoordinates && vehicleData.speed !== undefined

        if (!hasNewFormat) {
            throw new BadRequestException(
                'Invalid input format. Please provide either:\n' +
                    '- New format: locationCoordinates, speed\n',
            )
        }

        // Validate required fields
        if (vehicleData.capacity <= 0) {
            throw new BadRequestException('Vehicle capacity must be greater than 0')
        }

        if (!['bus', 'van', 'boat'].includes(vehicleData.type.toLowerCase())) {
            throw new BadRequestException('Vehicle type must be bus, van, or boat')
        }

        // Validate new format specific fields
        if (hasNewFormat) {
            if (vehicleData.speed! <= 0) {
                throw new BadRequestException('Vehicle speed must be greater than 0')
            }
            if (
                !vehicleData.locationCoordinates!.latitude ||
                !vehicleData.locationCoordinates!.longitude
            ) {
                throw new BadRequestException(
                    'Valid latitude and longitude coordinates are required',
                )
            }
        }
    }

    getAllVehicles() {
        return this.vehicles
    }

    getVehicleById(id: string) {
        return this.vehicles.find((vehicle) => vehicle.id === id || vehicle.vehicleId === id)
    }

    getVehiclesByType(type: string) {
        return this.vehicles.filter((vehicle) => vehicle.type.toLowerCase() === type.toLowerCase())
    }

    getVehiclesInRange(coordinates: { latitude: number; longitude: number }, maxDistance: number) {
        return this.vehicles.filter((vehicle) => {
            if (!vehicle.locationCoordinates) return false

            // Simple distance calculation (you might want to use a more accurate formula)
            const distance = this.calculateDistance(
                coordinates.latitude,
                coordinates.longitude,
                vehicle.locationCoordinates.latitude,
                vehicle.locationCoordinates.longitude,
            )

            return distance <= maxDistance
        })
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        // Haversine formula for calculating distance between two coordinates
        const R = 6371 // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1)
        const dLon = this.toRadians(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180)
    }
}
