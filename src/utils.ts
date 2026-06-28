import { FuelRefill, Vehicle, UserPreferences, EfficiencyUnit, DistanceUnit, VolumeUnit } from './types';

// Unit conversion constants
const KM_TO_MILE = 0.621371;
const MILE_TO_KM = 1.60934;
const LITERS_TO_GALLONS = 0.264172;
const GALLONS_TO_LITERS = 3.78541;

/**
 * Calculates fuel efficiency for a list of refills.
 * Refills are grouped by vehicle, sorted by odometer ascending, and calculated based on consecutive full-tank fill ups.
 */
export function calculateRefillEfficiencies(
  refills: FuelRefill[],
  preferences: UserPreferences
): FuelRefill[] {
  // Group refills by vehicle
  const refillsByVehicle: { [vehicleId: string]: FuelRefill[] } = {};
  
  refills.forEach(refill => {
    if (!refillsByVehicle[refill.vehicleId]) {
      refillsByVehicle[refill.vehicleId] = [];
    }
    refillsByVehicle[refill.vehicleId].push({ ...refill });
  });

  const updatedRefills: FuelRefill[] = [];

  // Calculate for each vehicle's group
  Object.keys(refillsByVehicle).forEach(vehicleId => {
    const list = refillsByVehicle[vehicleId].sort((a, b) => a.odometer - b.odometer);
    
    for (let i = 0; i < list.length; i++) {
      const current = list[i];
      
      // We can only calculate efficiency if there is a previous refill to measure distance and both are full tank
      if (i > 0) {
        const previous = list[i - 1];
        const distance = current.odometer - previous.odometer;

        if (distance > 0 && current.fullTank && previous.fullTank) {
          current.efficiency = computeEfficiency(distance, current.volume, preferences);
        }
      }
      
      updatedRefills.push(current);
    }
  });

  return updatedRefills;
}

/**
 * Core efficiency formula based on units and preference.
 */
export function computeEfficiency(
  distance: number, // in current vehicle distance unit (implied by preference)
  volume: number,   // in current volume unit (implied by preference)
  preferences: UserPreferences
): number {
  if (distance <= 0 || volume <= 0) return 0;

  const distUnit = preferences.distanceUnit;
  const volUnit = preferences.volumeUnit;
  const targetEffUnit = preferences.efficiencyUnit;

  // Convert distance and volume to standard metric (KM and Liters) first
  let km = distance;
  if (distUnit === 'mi') {
    km = distance * MILE_TO_KM;
  }

  let liters = volume;
  if (volUnit === 'gal') {
    liters = volume * GALLONS_TO_LITERS;
  }

  // Calculate in requested output format
  if (targetEffUnit === 'L/100km') {
    return (liters / km) * 100;
  } else if (targetEffUnit === 'km/L') {
    return km / liters;
  } else { // 'mpg' (US MPG)
    const miles = km * KM_TO_MILE;
    const gallons = liters * LITERS_TO_GALLONS;
    return miles / gallons;
  }
}

/**
 * Format helper for fuel efficiency
 */
export function formatEfficiency(val: number | undefined | null, unit: EfficiencyUnit): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return '--';
  return `${val.toFixed(2)} ${unit}`;
}

/**
 * Currency formatter
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Date formatter (YYYY-MM-DD to readable)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC' // Keep dates persistent and predictable
  });
}

/**
 * Get color scheme tailwind background utilities
 */
export function getVehiclesColorMap(hex: string): { bg: string; text: string; border: string; style?: any } {
  const map: { [key: string]: { bg: string; text: string; border: string } } = {
    '#0ea5e9': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    '#10b981': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    '#f59e0b': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    '#ef4444': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    '#8b5cf6': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
    '#ec4899': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  };

  if (map[hex]) {
    return map[hex];
  }

  // Fallback support for any custom hex color
  return {
    bg: '',
    text: '',
    border: '',
    style: {
      backgroundColor: `${hex}1a`, // 10% opacity in hex
      color: hex,
      borderColor: `${hex}4d`, // 30% opacity in hex
    }
  };
}

/**
 * Formats a string or number with commas for visual presentation as user types.
 */
export function formatNumberWithCommas(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const str = String(value);
  const parts = str.split('.');
  const cleanInt = parts[0].replace(/[^\d-]/g, '');
  const formattedInt = cleanInt ? Number(cleanInt).toLocaleString('en-US') : '';
  if (parts.length > 1) {
    const cleanDec = parts[1].replace(/[^\d]/g, '');
    return `${formattedInt}.${cleanDec}`;
  }
  return formattedInt;
}

/**
 * Parses out commas from formatted string.
 */
export function parseNumberFromCommas(value: string): string {
  return value.replace(/,/g, '');
}

