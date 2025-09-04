import { IsString, IsNumber, IsNotEmpty, IsOptional, Min, Max, IsLatitude, IsLongitude } from 'class-validator';

export class LocationCoordinatesDto {
  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @IsLongitude()
  @IsNotEmpty()
  longitude: number;
}

export class EvacuationZoneDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  zoneId?: string; // Will be auto-generated if not provided

  @IsNotEmpty()
  locationCoordinates: LocationCoordinatesDto;

  @IsNumber()
  @Min(1)
  numberOfPeople: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  urgencyLevel: number; // 1 = low urgency, 5 = high urgency

  // Legacy fields for backward compatibility
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  people?: number;

  @IsOptional()
  @IsString()
  urgency?: string;
}