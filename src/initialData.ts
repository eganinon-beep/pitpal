import { Vehicle, FuelRefill, MaintenanceLog, RenewalReminder, UserPreferences } from './types';

export const INITIAL_PREFERENCES: UserPreferences = {
  distanceUnit: 'km',
  volumeUnit: 'L',
  efficiencyUnit: 'L/100km',
  currency: 'USD'
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    name: 'Honda Civic Sport',
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    licensePlate: '7XYZ89',
    startingOdometer: 54320,
    currentOdometer: 54320,
    color: '#0ea5e9', // Sky blue
    notes: 'Daily driver. Standard unleaded fuel.',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
  },
  {
    id: 'v2',
    name: 'Subaru Outback',
    make: 'Subaru',
    model: 'Outback Edition',
    year: 2022,
    licensePlate: '9ABC12',
    startingOdometer: 32150,
    currentOdometer: 32150,
    color: '#10b981', // Emerald
    notes: 'Family adventure wagon. All Wheel Drive.',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
  }
];

export const INITIAL_REFILLS: FuelRefill[] = [
  // Refills for Honda Civic (v1)
  {
    id: 'f1',
    vehicleId: 'v1',
    date: '2026-04-10',
    odometer: 52100,
    volume: 42.5,
    pricePerUnit: 1.65,
    totalCost: 70.13,
    fullTank: true,
    notes: 'Initial filling'
  },
  {
    id: 'f2',
    vehicleId: 'v1',
    date: '2026-04-25',
    odometer: 52680, // 580 km driven
    volume: 39.8,
    pricePerUnit: 1.68,
    totalCost: 66.86,
    fullTank: true,
    notes: 'Shell Station fuel'
  },
  {
    id: 'f3',
    vehicleId: 'v1',
    date: '2026-05-12',
    odometer: 53240, // 560 km driven
    volume: 38.6,
    pricePerUnit: 1.72,
    totalCost: 66.39,
    fullTank: true,
    notes: 'Costco Fuel, cheaper rate'
  },
  {
    id: 'f4',
    vehicleId: 'v1',
    date: '2026-05-28',
    odometer: 53810, // 570 km driven
    volume: 40.2,
    pricePerUnit: 1.69,
    totalCost: 67.94,
    fullTank: true,
    notes: 'Standard refill'
  },
  {
    id: 'f5',
    vehicleId: 'v1',
    date: '2026-06-15',
    odometer: 54320, // 510 km driven
    volume: 36.1,
    pricePerUnit: 1.74,
    totalCost: 62.81,
    fullTank: true,
    notes: 'Refill before weekend trip'
  },

  // Refills for Subaru Outback (v2)
  {
    id: 'f6',
    vehicleId: 'v2',
    date: '2026-05-01',
    odometer: 30100,
    volume: 55.0,
    pricePerUnit: 1.75,
    totalCost: 96.25,
    fullTank: true
  },
  {
    id: 'f7',
    vehicleId: 'v2',
    date: '2026-05-20',
    odometer: 31050, // 950 km driven
    volume: 58.2,
    pricePerUnit: 1.78,
    totalCost: 103.59,
    fullTank: true
  },
  {
    id: 'f8',
    vehicleId: 'v2',
    date: '2026-06-10',
    odometer: 32150, // 1100 km driven
    volume: 62.1,
    pricePerUnit: 1.82,
    totalCost: 113.02,
    fullTank: true,
    notes: 'Highway trip refill'
  }
];

export const INITIAL_MAINTENANCE: MaintenanceLog[] = [
  {
    id: 'm1',
    vehicleId: 'v1',
    date: '2026-04-15',
    serviceType: 'Oil Change',
    title: 'Synthetic Oil & Filter Replacement',
    odometer: 52150,
    cost: 89.99,
    provider: 'Honda Dealership Service',
    notes: 'Standard fully synthetic 0W-20 oil. Changed filter and checked engine fluids.',
    status: 'Completed',
    nextDueDate: '2026-10-15',
    nextDueOdometer: 62150
  },
  {
    id: 'm2',
    vehicleId: 'v1',
    date: '2026-06-05',
    serviceType: 'Tire Rotation',
    title: '4-Wheel Tire Rotation & Balance',
    odometer: 53900,
    cost: 45.00,
    provider: 'Discount Tire Co.',
    notes: 'Rotated front to back, balanced all four. Tires show 6/32" tread remaining.',
    status: 'Completed',
    nextDueDate: '2026-12-05',
    nextDueOdometer: 63900
  },
  {
    id: 'm3',
    vehicleId: 'v2',
    date: '2025-11-20', // Pre-logged
    serviceType: 'Other',
    title: 'Pre-purchase Inspection & Fluid Flush',
    odometer: 28500,
    cost: 220.00,
    provider: 'Subaru Specialist',
    notes: 'Checked AWD system, brakes, flushed engine coolant. Diagnostics clear.',
    status: 'Completed'
  },
  {
    id: 'm4',
    vehicleId: 'v1',
    date: '2026-07-10', // Scheduled in future
    serviceType: 'Brake Service',
    title: 'Front Brake Pads & Rotor Resurfacing',
    odometer: 55000,
    cost: 350.00,
    provider: 'Precision Brakes',
    notes: 'Scheduled for slight squeak under braking.',
    status: 'Scheduled',
    nextDueDate: '2026-07-10'
  }
];

export const INITIAL_REMINDERS: RenewalReminder[] = [
  {
    id: 'r1',
    vehicleId: 'v1',
    type: 'Registration',
    title: 'Civic Sport Annual Registration',
    dueDate: '2026-07-10', // 18 days from current local date 2026-06-22
    alertDaysBefore: 30,
    completed: false,
    notes: 'Requires smog check certificate this cycle. Renewable online.'
  },
  {
    id: 'r2',
    vehicleId: 'all',
    type: 'License',
    title: "Driver's License Renewal",
    dueDate: '2026-12-15', // about 6 months away
    alertDaysBefore: 60,
    completed: false,
    notes: 'Must go in person to DMV for vision exam and new photo.'
  },
  {
    id: 'r3',
    vehicleId: 'v2',
    type: 'Insurance',
    title: 'Outback GEICO Premium Renewal',
    dueDate: '2026-08-01', // over a month away
    alertDaysBefore: 15,
    completed: false,
    notes: 'Check if there are multi-car discount updates.'
  }
];
