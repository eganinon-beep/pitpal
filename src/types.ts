export type DistanceUnit = 'km' | 'mi';
export type VolumeUnit = 'L' | 'gal';
export type EfficiencyUnit = 'L/100km' | 'km/L' | 'mpg';

export interface UserPreferences {
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  efficiencyUnit: EfficiencyUnit;
  currency?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  startingOdometer: number;
  currentOdometer: number;
  color: string; // Tailwind hex color or class name
  notes?: string;
  vehicleType?: string; // e.g. Sedan, SUV, etc.
  fuelType?: string; // e.g. Gasoline, Diesel, etc.
  createdAt: string;
}

export interface FuelRefill {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number; // Odometer reading at time of refill
  volume: number; // Liters or Gallons
  pricePerUnit: number; // Price per liter or gallon
  totalCost: number;
  fullTank: boolean;
  gasStation?: string; // Gas Station
  fuelBrand?: string; // Fuel Brand
  notes?: string;
  receiptPhoto?: string; // Optional Base64 or Object URL photo of receipt
  // Calculated properties
  efficiency?: number; // Calculated efficiency (represents unit of EfficiencyUnit)
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  serviceType: string; // e.g., "Oil Change", "Tire Rotation", "Brake Service", "Engine Air Filter", "Cabin Filter", "Battery Replacement", "Other"
  title: string;
  odometer: number;
  cost: number;
  provider: string;
  notes?: string;
  status: 'Scheduled' | 'Completed';
  nextDueDate?: string; // Date for when it should be done next
  nextDueOdometer?: number; // Odometer for when it should be done next
  receiptPhoto?: string; // Optional Base64 or Object URL photo of receipt
}

export interface RenewalReminder {
  id: string;
  vehicleId: string | 'all'; // Reference a vehicle or driver-general
  type: 'License' | 'Registration' | 'Insurance' | 'Other';
  title: string;
  dueDate: string;
  alertDaysBefore: number; // e.g., 7, 14, 30 days
  completed: boolean;
  notes?: string;
  expirationFrequency?: 'specific-date' | 'every-2nd-day' | 'every-3rd-week-month';
  selectedMonth?: string; // e.g., "January", "February", etc. for every 3rd week
}
