import { Vehicle, FuelRefill, MaintenanceLog, RenewalReminder, UserPreferences } from './types';

export const INITIAL_PREFERENCES: UserPreferences = {
  distanceUnit: 'km',
  volumeUnit: 'L',
  efficiencyUnit: 'L/100km',
  currency: 'USD'
};

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_REFILLS: FuelRefill[] = [];

export const INITIAL_MAINTENANCE: MaintenanceLog[] = [];

export const INITIAL_REMINDERS: RenewalReminder[] = [];
