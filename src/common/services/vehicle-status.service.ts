import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@common/cache/redis.service';

export interface VehicleStatus {
  vehicleId: string;
  available: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTask?: {
    zoneId: string;
    estimatedCompletion: Date;
    status: 'en_route' | 'evacuating' | 'returning';
  };
  lastUpdated: Date;
  batteryLevel?: number;
  fuelLevel?: number;
  capacity: number;
  currentLoad: number;
}

@Injectable()
export class VehicleStatusService {
  private readonly logger = new Logger(VehicleStatusService.name);

  constructor(private readonly redisService: RedisService) {}

  async updateVehicleStatus(status: VehicleStatus): Promise<void> {
    try {
      await this.redisService.setVehicleStatus(status.vehicleId, {
        available: status.available,
        currentLocation: status.currentLocation,
        lastUpdated: status.lastUpdated
      });

      // Store detailed status separately
      const detailedKey = `vehicle_detail:${status.vehicleId}`;
      await this.redisService.set(detailedKey, status, 24 * 60 * 60); // 24 hours TTL

      this.logger.debug(`Updated status for vehicle ${status.vehicleId}`);
    } catch (error) {
      this.logger.error(`Failed to update vehicle status: ${error.message}`);
      throw error;
    }
  }

  async getVehicleStatus(vehicleId: string): Promise<VehicleStatus | null> {
    try {
      const detailedKey = `vehicle_detail:${vehicleId}`;
      return await this.redisService.get<VehicleStatus>(detailedKey);
    } catch (error) {
      this.logger.error(`Failed to get vehicle status: ${error.message}`);
      return null;
    }
  }

  async getAllVehicleStatuses(): Promise<VehicleStatus[]> {
    try {
      const availableVehicleIds = await this.redisService.getAvailableVehicles();
      const statuses: VehicleStatus[] = [];

      for (const vehicleId of availableVehicleIds) {
        const status = await this.getVehicleStatus(vehicleId);
        if (status) {
          statuses.push(status);
        }
      }

      return statuses;
    } catch (error) {
      this.logger.error(`Failed to get all vehicle statuses: ${error.message}`);
      return [];
    }
  }

  async markVehicleUnavailable(
    vehicleId: string, 
    reason: string, 
    estimatedAvailableAt?: Date
  ): Promise<void> {
    try {
      const currentStatus = await this.getVehicleStatus(vehicleId);
      if (!currentStatus) {
        this.logger.warn(`Vehicle ${vehicleId} not found`);
        return;
      }

      const updatedStatus: VehicleStatus = {
        ...currentStatus,
        available: false,
        lastUpdated: new Date(),
        currentTask: {
          zoneId: reason,
          estimatedCompletion: estimatedAvailableAt || new Date(Date.now() + 30 * 60 * 1000), // Default 30 min
          status: 'en_route'
        }
      };

      await this.updateVehicleStatus(updatedStatus);
      this.logger.log(`Vehicle ${vehicleId} marked unavailable: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to mark vehicle unavailable: ${error.message}`);
      throw error;
    }
  }

  async markVehicleAvailable(vehicleId: string, location?: { latitude: number; longitude: number }): Promise<void> {
    try {
      const currentStatus = await this.getVehicleStatus(vehicleId);
      if (!currentStatus) {
        this.logger.warn(`Vehicle ${vehicleId} not found`);
        return;
      }

      const updatedStatus: VehicleStatus = {
        ...currentStatus,
        available: true,
        currentLocation: location || currentStatus.currentLocation,
        currentTask: undefined,
        lastUpdated: new Date()
      };

      await this.updateVehicleStatus(updatedStatus);
      this.logger.log(`Vehicle ${vehicleId} marked available`);
    } catch (error) {
      this.logger.error(`Failed to mark vehicle available: ${error.message}`);
      throw error;
    }
  }

  async getVehiclesByZone(zoneId: string): Promise<VehicleStatus[]> {
    try {
      const allStatuses = await this.getAllVehicleStatuses();
      return allStatuses.filter(status => 
        status.currentTask?.zoneId === zoneId
      );
    } catch (error) {
      this.logger.error(`Failed to get vehicles by zone: ${error.message}`);
      return [];
    }
  }

  async getVehiclesNeedingMaintenance(): Promise<VehicleStatus[]> {
    try {
      const allStatuses = await this.getAllVehicleStatuses();
      return allStatuses.filter(status => 
        (status.batteryLevel && status.batteryLevel < 20) ||
        (status.fuelLevel && status.fuelLevel < 15) ||
        !status.available
      );
    } catch (error) {
      this.logger.error(`Failed to get vehicles needing maintenance: ${error.message}`);
      return [];
    }
  }
}
