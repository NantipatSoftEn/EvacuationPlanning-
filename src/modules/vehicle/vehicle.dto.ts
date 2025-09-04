import { IsString, IsNumber, IsNotEmpty, IsOptional, Min, IsIn, IsLatitude, IsLongitude } from 'class-validator';

export class LocationCoordinatesDto {
  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @IsLongitude()
  @IsNotEmpty()
  longitude: number;
}

export class VehicleCreateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  vehicleId?: string; // Will be auto-generated if not provided

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsString()
  @IsIn(['bus', 'van', 'boat'])
  type: string;

  @IsNotEmpty()
  locationCoordinates: LocationCoordinatesDto;

  @IsNumber()
  @Min(1)
  speed: number; // Average speed in km/h

  // Legacy field for backward compatibility
  @IsOptional()
  @IsString()
  location?: string;
}
