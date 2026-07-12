import React, { useState, useEffect } from 'react';
import { Gauge, X, Droplet, Wrench, AlertCircle, Calendar, DollarSign, Camera } from 'lucide-react';
import MobileFrame from './components/MobileFrame';
import DashboardTab from './components/DashboardTab';
import VehiclesTab from './components/VehiclesTab';
import FuelTab from './components/FuelTab';
import MaintenanceTab from './components/MaintenanceTab';
import RemindersTab from './components/RemindersTab';
import ReportsTab from './components/ReportsTab';

import {
  INITIAL_PREFERENCES,
  INITIAL_VEHICLES,
  INITIAL_REFILLS,
  INITIAL_MAINTENANCE,
  INITIAL_REMINDERS
} from './initialData';

import { Vehicle, FuelRefill, MaintenanceLog, RenewalReminder, UserPreferences } from './types';
import { formatNumberWithCommas, parseNumberFromCommas, getGasStationSuggestions, getFuelBrandSuggestions, saveGasStationEntry, saveFuelBrandEntry } from './utils';

const getCurrencySymbol = (code: string = 'USD') => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: '$',
    CAD: '$',
    JPY: '¥',
    PHP: '₱',
    INR: '₹',
    SGD: '$',
    NZD: '$'
  };
  return symbols[code] || '$';
};

export default function App() {
  // --- 1. CORE APPLICATIONS STORAGE STATES ---
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('vc_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse vc_preferences from localStorage', e);
    }
    return INITIAL_PREFERENCES;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem('vc_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse vc_vehicles from localStorage', e);
    }
    return INITIAL_VEHICLES;
  });

  const [refills, setRefills] = useState<FuelRefill[]>(() => {
    try {
      const saved = localStorage.getItem('vc_refills');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse vc_refills from localStorage', e);
    }
    return INITIAL_REFILLS;
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    try {
      const saved = localStorage.getItem('vc_maintenance_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse vc_maintenance_logs from localStorage', e);
    }
    return INITIAL_MAINTENANCE;
  });

  const [reminders, setReminders] = useState<RenewalReminder[]>(() => {
    try {
      const saved = localStorage.getItem('vc_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse vc_reminders from localStorage', e);
    }
    return INITIAL_REMINDERS;
  });

  // --- 2. PERSISTENCE TRIGGER ROUTINES ---
  useEffect(() => {
    localStorage.setItem('vc_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('vc_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('vc_refills', JSON.stringify(refills));
  }, [refills]);

  useEffect(() => {
    localStorage.setItem('vc_maintenance_logs', JSON.stringify(maintenanceLogs));
  }, [maintenanceLogs]);

  useEffect(() => {
    localStorage.setItem('vc_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Dynamic Odometer Synchronization:
  // "Actual odometer (current) of the vehicle must always be the highest mileage recorded for the vehicle."
  useEffect(() => {
    setVehicles(prevVehicles => {
      let changed = false;
      const updated = prevVehicles.map(v => {
        const vehicleRefills = refills.filter(r => r.vehicleId === v.id);
        const vehicleLogs = maintenanceLogs.filter(
          l => l.vehicleId === v.id && l.status === 'Completed'
        );

        const maxOdometer = Math.max(
          v.startingOdometer !== undefined ? v.startingOdometer : v.currentOdometer,
          ...vehicleRefills.map(r => r.odometer),
          ...vehicleLogs.map(l => l.odometer)
        );

        if (v.currentOdometer !== maxOdometer) {
          changed = true;
          return { ...v, currentOdometer: maxOdometer };
        }
        return v;
      });

      return changed ? updated : prevVehicles;
    });
  }, [refills, maintenanceLogs]);

  // --- 3. SYSTEM VIEW AND INTERACTION STATE CONTROLS ---
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'all'>('all');

  // Vehicle Detail Sub-View states inside Garage
  const [selectedDetailVehicleId, setSelectedDetailVehicleId] = useState<string | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<'refills' | 'services'>('refills');
  const [showAddFormInDetail, setShowAddFormInDetail] = useState(false);
  const [initialSelectedActivityId, setInitialSelectedActivityId] = useState<{ id: string, type: 'refill' | 'maintenance' | 'odometer' } | null>(null);

  // Multi-tab quick form launchers
  const [quickAddFuel, setQuickAddFuel] = useState(false);
  const [quickAddMaint, setQuickAddMaint] = useState(false);
  const [quickAddReminder, setQuickAddReminder] = useState(false);

  // States to hide FAB
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);

  // Reset adding states when changing tabs
  useEffect(() => {
    setIsAddingVehicle(false);
    setIsAddingDocument(false);
  }, [activeTab]);

  // Update Mileage Quick Action States
  const [showUpdateMileageModal, setShowUpdateMileageModal] = useState(false);
  const [updateMileageVehicleId, setUpdateMileageVehicleId] = useState('');
  const [newMileageValue, setNewMileageValue] = useState<number | string>('');
  const [newMileageDate, setNewMileageDate] = useState('');
  const [newMileageNotes, setNewMileageNotes] = useState('');
  const [updateMileageError, setUpdateMileageError] = useState('');
  const [quickMileageReceiptPhoto, setQuickMileageReceiptPhoto] = useState('');

  // Quick Fuel Refill Modal States
  const [showQuickFuelModal, setShowQuickFuelModal] = useState(false);
  const [quickFuelVehicleId, setQuickFuelVehicleId] = useState('');
  const [quickFuelDate, setQuickFuelDate] = useState('');
  const [quickFuelOdometer, setQuickFuelOdometer] = useState<number | string>('');
  const [quickFuelVolume, setQuickFuelVolume] = useState<number | string>('');
  const [quickFuelPricePerUnit, setQuickFuelPricePerUnit] = useState<number | string>('');
  const [quickFuelTotalCost, setQuickFuelTotalCost] = useState<number | string>('');
  const [quickFuelFullTank, setQuickFuelFullTank] = useState(true);
  const [quickFuelGasStation, setQuickFuelGasStation] = useState('');
  const [quickFuelFuelBrand, setQuickFuelFuelBrand] = useState('');
  const [quickFuelNotes, setQuickFuelNotes] = useState('');
  const [quickFuelError, setQuickFuelError] = useState('');
  const [quickFuelReceiptPhoto, setQuickFuelReceiptPhoto] = useState('');
  const [quickFuelEditHistory, setQuickFuelEditHistory] = useState<('volume' | 'price' | 'cost')[]>([]);

  // Quick Record Service Modal States
  const [showQuickMaintModal, setShowQuickMaintModal] = useState(false);
  const [quickMaintVehicleId, setQuickMaintVehicleId] = useState('');
  const [quickMaintDate, setQuickMaintDate] = useState('');
  const [quickMaintServiceType, setQuickMaintServiceType] = useState('');
  const [quickMaintTitle, setQuickMaintTitle] = useState('');
  const [quickMaintOdometer, setQuickMaintOdometer] = useState<number | string>('');
  const [quickMaintCost, setQuickMaintCost] = useState<number | string>('');
  const [quickMaintProvider, setQuickMaintProvider] = useState('');
  const [quickMaintNotes, setQuickMaintNotes] = useState('');
  const [quickMaintStatus, setQuickMaintStatus] = useState<'Scheduled' | 'Completed'>('Completed');
  const [quickMaintHasRecurrence, setQuickMaintHasRecurrence] = useState(true);
  const [quickMaintScheduleType, setQuickMaintScheduleType] = useState<'Calendar-and-Mileage' | 'Calendar-Only' | 'Mileage-Only'>('Calendar-and-Mileage');
  const [quickMaintNextDueDate, setQuickMaintNextDueDate] = useState('');
  const [quickMaintNextDueOdometer, setQuickMaintNextDueOdometer] = useState<number | string>('');
  const [quickMaintError, setQuickMaintError] = useState('');
  const [quickMaintReceiptPhoto, setQuickMaintReceiptPhoto] = useState('');

  // Photo Compress Helper for Quick Actions
  const handleQuickPhotoChange = (file: File, callback: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      if (file.size > 1.5 * 1024 * 1024) {
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            callback(compressedUrl);
          } else {
            callback(imgUrl);
          }
        };
      } else {
        callback(imgUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Fuel auto calculation helper functions
  const updateQuickFuelHistoryAndCalculate = (
    fieldChanged: 'volume' | 'price' | 'cost',
    nextValue: string
  ) => {
    const nextHistory = quickFuelEditHistory.filter(f => f !== fieldChanged);
    nextHistory.push(fieldChanged);
    setQuickFuelEditHistory(nextHistory);

    const currentValues = {
      volume: fieldChanged === 'volume' ? nextValue : quickFuelVolume.toString(),
      price: fieldChanged === 'price' ? nextValue : quickFuelPricePerUnit.toString(),
      cost: fieldChanged === 'cost' ? nextValue : quickFuelTotalCost.toString(),
    };

    if (nextHistory.length >= 2) {
      const lastTwo = nextHistory.slice(-2);
      const target = (['volume', 'price', 'cost'] as const).find(f => !lastTwo.includes(f));
      
      if (target) {
        const valA = parseFloat(currentValues[lastTwo[0]]);
        const valB = parseFloat(currentValues[lastTwo[1]]);

        if (!isNaN(valA) && valA > 0 && !isNaN(valB) && valB > 0) {
          if (target === 'cost') {
            const v = parseFloat(currentValues.volume);
            const p = parseFloat(currentValues.price);
            if (!isNaN(v) && v > 0 && !isNaN(p) && p > 0) {
              setQuickFuelTotalCost((v * p).toFixed(2));
            }
          } else if (target === 'volume') {
            const c = parseFloat(currentValues.cost);
            const p = parseFloat(currentValues.price);
            if (!isNaN(c) && c > 0 && !isNaN(p) && p > 0) {
              setQuickFuelVolume((c / p).toFixed(2));
            }
          } else if (target === 'price') {
            const c = parseFloat(currentValues.cost);
            const v = parseFloat(currentValues.volume);
            if (!isNaN(c) && c > 0 && !isNaN(v) && v > 0) {
              setQuickFuelPricePerUnit((c / v).toFixed(2));
            }
          }
        }
      }
    }
  };

  const handleQuickFuelVolumeChange = (val: string) => {
    setQuickFuelVolume(val);
    updateQuickFuelHistoryAndCalculate('volume', val);
  };

  const handleQuickFuelPriceChange = (val: string) => {
    setQuickFuelPricePerUnit(val);
    updateQuickFuelHistoryAndCalculate('price', val);
  };

  const handleQuickFuelCostChange = (val: string) => {
    setQuickFuelTotalCost(val);
    updateQuickFuelHistoryAndCalculate('cost', val);
  };

  // --- 4. DATA MODEL INTEGRITY EVENT HANDLERS ---
  
  // A. Preference Updates
  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updated }));
  };

  // B. Vehicles CRUD
  const handleAddVehicle = (newVeh: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const veh: Vehicle = {
      ...newVeh,
      id: `vehicle_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setVehicles(prev => [...prev, veh]);
  };

  const handleDeleteVehicle = (id: string) => {
    // 1. Remove Vehicle Profiling
    setVehicles(prev => prev.filter(v => v.id !== id));
    
    // 2. Cascade: Clean corresponding fuel receipts
    setRefills(prev => prev.filter(r => r.vehicleId !== id));

    // 3. Cascade: Clean corresponding service logbooks
    setMaintenanceLogs(prev => prev.filter(m => m.vehicleId !== id));

    // 4. Cascade: Clean vehicle general reminders
    setReminders(prev => prev.filter(rem => rem.vehicleId !== id));

    // Reset selected vehicle filter if deleted vehicle was current active selection
    if (selectedVehicleId === id) {
      setSelectedVehicleId('all');
    }
  };

  const handleEditVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  // C. Fuel Refills CRUD
  const handleAddRefill = (newRef: Omit<FuelRefill, 'id'>) => {
    const refill: FuelRefill = {
      ...newRef,
      id: `refill_${Date.now()}`
    };
    setRefills(prev => [...prev, refill]);

    // Odometer synchronization: Auto elevate vehicle odometer if this ticket represents a higher mileage
    setVehicles(prevCars => prevCars.map(c => {
      if (c.id === refill.vehicleId && refill.odometer > c.currentOdometer) {
        return { ...c, currentOdometer: refill.odometer };
      }
      return c;
    }));
  };

  const handleDeleteRefill = (id: string) => {
    setRefills(prev => prev.filter(r => r.id !== id));
  };

  const handleEditRefill = (id: string, updates: Partial<FuelRefill>) => {
    setRefills(prev => prev.map(r => {
      if (r.id === id) {
        const merged = { ...r, ...updates };
        if (merged.odometer > 0) {
          setVehicles(prevCars => prevCars.map(c => {
            if (c.id === merged.vehicleId && merged.odometer > c.currentOdometer) {
              return { ...c, currentOdometer: merged.odometer };
            }
            return c;
          }));
        }
        return merged;
      }
      return r;
    }));
  };

  // D. Maintenance Schedule CRUD
  const handleAddLog = (newLog: Omit<MaintenanceLog, 'id'>) => {
    const log: MaintenanceLog = {
      ...newLog,
      id: `maint_${Date.now()}`
    };
    setMaintenanceLogs(prev => [...prev, log]);

    // Odometer sync: Auto elevate vehicle odometer if service was performed at a higher mileage
    if (log.status === 'Completed') {
      setVehicles(prevCars => prevCars.map(c => {
        if (c.id === log.vehicleId && log.odometer > c.currentOdometer) {
          return { ...c, currentOdometer: log.odometer };
        }
        return c;
      }));
    }
  };

  const handleUpdateStatus = (id: string, updates: Partial<MaintenanceLog>) => {
    setMaintenanceLogs(prev => prev.map(m => {
      if (m.id === id) {
        const merged = { ...m, ...updates };
        
        // If completed status was just checked off, synchronize car odometer
        if (merged.status === 'Completed' && merged.odometer > 0) {
          setVehicles(prevCars => prevCars.map(c => {
            if (c.id === merged.vehicleId && merged.odometer > c.currentOdometer) {
              return { ...c, currentOdometer: merged.odometer };
            }
            return c;
          }));
        }
        return merged;
      }
      return m;
    }));
  };

  const handleDeleteLog = (id: string) => {
    setMaintenanceLogs(prev => prev.filter(m => m.id !== id));
  };

  const handleEditLog = (id: string, updates: Partial<MaintenanceLog>) => {
    setMaintenanceLogs(prev => prev.map(m => {
      if (m.id === id) {
        const merged = { ...m, ...updates };
        if (merged.status === 'Completed' && merged.odometer > 0) {
          setVehicles(prevCars => prevCars.map(c => {
            if (c.id === merged.vehicleId && merged.odometer > c.currentOdometer) {
              return { ...c, currentOdometer: merged.odometer };
            }
            return c;
          }));
        }
        return merged;
      }
      return m;
    }));
  };

  // E. Renewal Deadlines CRUD
  const handleAddReminder = (newRem: Omit<RenewalReminder, 'id'>) => {
    const reminder: RenewalReminder = {
      ...newRem,
      id: `reminder_${Date.now()}`
    };
    setReminders(prev => [...prev, reminder]);
  };

  const handleUpdateReminderStatus = (id: string, updates: Partial<RenewalReminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // --- 5. DATA PORTABILITY: EXPORT AND IMPORT HANDLERS ---
  const handleExportBackup = () => {
    const backupData = {
      vehicles,
      refills,
      maintenanceLogs,
      reminders,
      preferences,
      exportVersion: '1.0',
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vehicle_companion_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed && Array.isArray(parsed.vehicles) && Array.isArray(parsed.refills) && Array.isArray(parsed.maintenanceLogs) && Array.isArray(parsed.reminders)) {
        // Hydrate React states
        setVehicles(parsed.vehicles);
        setRefills(parsed.refills);
        setMaintenanceLogs(parsed.maintenanceLogs);
        setReminders(parsed.reminders);
        if (parsed.preferences) {
          setPreferences(parsed.preferences);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleOpenQuickLogRefill = () => {
    if (vehicles.length > 0) {
      const activeId = selectedVehicleId === 'all' ? vehicles[0].id : selectedVehicleId;
      setQuickFuelVehicleId(activeId);
    } else {
      setQuickFuelVehicleId('');
    }
    setQuickFuelOdometer('');
    setQuickFuelDate('');
    setQuickFuelVolume('');
    setQuickFuelPricePerUnit('');
    setQuickFuelTotalCost('');
    setQuickFuelFullTank(true);
    setQuickFuelGasStation('');
    setQuickFuelFuelBrand('');
    setQuickFuelNotes('');
    setQuickFuelReceiptPhoto('');
    setQuickFuelError('');
    setQuickFuelEditHistory([]);
    setShowQuickFuelModal(true);
  };

  const handleOpenQuickLogMaintenance = () => {
    if (vehicles.length > 0) {
      const activeId = selectedVehicleId === 'all' ? vehicles[0].id : selectedVehicleId;
      setQuickMaintVehicleId(activeId);
    } else {
      setQuickMaintVehicleId('');
    }
    setQuickMaintOdometer('');
    setQuickMaintDate('');
    setQuickMaintServiceType('');
    setQuickMaintTitle('');
    setQuickMaintCost('');
    setQuickMaintProvider('');
    setQuickMaintNotes('');
    setQuickMaintStatus('Completed');
    setQuickMaintHasRecurrence(true);
    setQuickMaintScheduleType('Calendar-and-Mileage');
    setQuickMaintNextDueDate('');
    setQuickMaintNextDueOdometer('');
    setQuickMaintReceiptPhoto('');
    setQuickMaintError('');
    setShowQuickMaintModal(true);
  };

  const handleOpenUpdateMileage = () => {
    if (vehicles.length > 0) {
      const activeId = selectedVehicleId === 'all' ? vehicles[0].id : selectedVehicleId;
      setUpdateMileageVehicleId(activeId);
    } else {
      setUpdateMileageVehicleId('');
    }
    setNewMileageValue('');
    setNewMileageDate('');
    setNewMileageNotes('');
    setQuickMileageReceiptPhoto('');
    setUpdateMileageError('');
    setShowUpdateMileageModal(true);
  };

  return (
    <MobileFrame
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      preferences={preferences}
      onUpdatePreferences={handleUpdatePreferences}
      onOpenQuickLogRefill={handleOpenQuickLogRefill}
      onOpenQuickLogMaintenance={handleOpenQuickLogMaintenance}
      onOpenUpdateMileage={handleOpenUpdateMileage}
      hideQuickAction={isAddingVehicle || isAddingDocument}
    >
      {/* 1. DASHBOARD VIEW */}
      <div className={`flex-1 overflow-y-auto px-5 pt-4 h-full scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200 ${activeTab === 'dashboard' ? 'block' : 'hidden'}`} id="dashboard-tab-wrapper">
        <DashboardTab
          vehicles={vehicles}
          refills={refills}
          maintenanceLogs={maintenanceLogs}
          reminders={reminders}
          preferences={preferences}
          selectedVehicleId={selectedVehicleId}
          setSelectedVehicleId={setSelectedVehicleId}
          onNavigateToTab={(tabId) => {
            if (tabId === 'vehicles') {
              setSelectedDetailVehicleId(null);
              setShowAddFormInDetail(false);
              setActiveTab('vehicles');
            } else if (tabId === 'maintenance') {
              setActiveTab('vehicles');
              setDetailSubTab('services');
              if (selectedVehicleId !== 'all') {
                setSelectedDetailVehicleId(selectedVehicleId);
              } else if (vehicles.length > 0) {
                setSelectedDetailVehicleId(vehicles[0].id);
              }
            } else {
              setActiveTab(tabId);
            }
          }}
          onSelectRecentOperation={(id, type, vehicleId) => {
            setSelectedDetailVehicleId(vehicleId);
            setInitialSelectedActivityId({ id, type });
            setActiveTab('vehicles');
          }}
        />
      </div>

      {/* 2. FLEET GARAGE TAB */}
      <div className={`flex-1 overflow-y-auto px-5 pt-4 h-full scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200 ${activeTab === 'vehicles' ? 'block' : 'hidden'}`} id="vehicles-tab-wrapper">
        <VehiclesTab
          vehicles={vehicles}
          refills={refills}
          maintenanceLogs={maintenanceLogs}
          preferences={preferences}
          onAddVehicle={handleAddVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onEditVehicle={handleEditVehicle}
          onAddRefill={handleAddRefill}
          onDeleteRefill={handleDeleteRefill}
          onEditRefill={handleEditRefill}
          onAddLog={handleAddLog}
          onUpdateStatus={handleUpdateStatus}
          onDeleteLog={handleDeleteLog}
          onEditLog={handleEditLog}
          selectedDetailVehicleId={selectedDetailVehicleId}
          setSelectedDetailVehicleId={setSelectedDetailVehicleId}
          detailSubTab={detailSubTab}
          setDetailSubTab={setDetailSubTab}
          showAddFormInDetail={showAddFormInDetail}
          setShowAddFormInDetail={setShowAddFormInDetail}
          onShowAddFormChange={setIsAddingVehicle}
          initialSelectedActivityId={initialSelectedActivityId}
          setInitialSelectedActivityId={setInitialSelectedActivityId}
        />
      </div>

      {/* 5. DRIVING DEADLINES & RENEWALS TAB */}
      <div className={`flex-1 overflow-y-auto px-5 pt-4 h-full scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200 ${activeTab === 'reminders' ? 'block' : 'hidden'}`} id="reminders-tab-wrapper">
        <RemindersTab
          reminders={reminders}
          vehicles={vehicles}
          onAddReminder={handleAddReminder}
          onUpdateReminderStatus={handleUpdateReminderStatus}
          onDeleteReminder={handleDeleteReminder}
          showAddFormImmediately={quickAddReminder}
          onCloseImmediateForm={() => setQuickAddReminder(false)}
          onShowAddFormChange={setIsAddingDocument}
        />
      </div>

      {/* 6. DIAGNOSTICS & BACKUPS TAB */}
      <div className={`flex-1 overflow-y-auto px-5 pt-4 h-full scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200 ${activeTab === 'reports' ? 'block' : 'hidden'}`} id="reports-tab-wrapper">
        <ReportsTab
          vehicles={vehicles}
          refills={refills}
          maintenanceLogs={maintenanceLogs}
          preferences={preferences}
          selectedVehicleId={selectedVehicleId}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />
      </div>

      {showUpdateMileageModal && (
        <div id="update-mileage-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="update-mileage-modal-container" className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col relative">
            <button
              id="update-mileage-modal-close-btn"
              onClick={() => {
                setShowUpdateMileageModal(false);
                setUpdateMileageError('');
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">Record Mileage</h3>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-800 flex-1">
              {updateMileageError && (
                <div id="update-mileage-error-alert" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{updateMileageError}</span>
                </div>
              )}

              {/* Vehicle Selection */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Select Vehicle</label>
                <select
                  id="update-mileage-vehicle-select"
                  value={updateMileageVehicleId}
                  onChange={(e) => {
                    const vehId = e.target.value;
                    setUpdateMileageVehicleId(vehId);
                    setNewMileageValue('');
                  }}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.year} {v.make} {v.model}) - {v.licensePlate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Mileage Readout */}
              {updateMileageVehicleId && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Reading:</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {vehicles.find(v => v.id === updateMileageVehicleId)?.currentOdometer.toLocaleString() || 0} {preferences.distanceUnit}
                  </span>
                </div>
              )}

              {/* Date Input */}
              <div className="space-y-1 min-w-0">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Date</label>
                <input
                  id="record-mileage-date-input"
                  type="date"
                  value={newMileageDate}
                  onChange={(e) => setNewMileageDate(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold min-w-0"
                />
              </div>

              {/* New Mileage Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Updated Odometer Reading ({preferences.distanceUnit})</label>
                <input
                  id="update-mileage-value-input"
                  type="text"
                  placeholder=""
                  value={formatNumberWithCommas(newMileageValue)}
                  onChange={(e) => {
                    const rawVal = parseNumberFromCommas(e.target.value);
                    if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) {
                      setNewMileageValue(rawVal);
                    }
                  }}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* Notes Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Notes</label>
                <input
                  id="update-mileage-notes-input"
                  type="text"
                  placeholder="e.g., Monthly check, routine update"
                  value={newMileageNotes}
                  onChange={(e) => setNewMileageNotes(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Odometer/Receipt Photo (Optional)</label>
                <div 
                  className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition gap-2 text-center cursor-pointer relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleQuickPhotoChange(file, setQuickMileageReceiptPhoto);
                    }
                  }}
                  onClick={() => document.getElementById('quick-mileage-photo-input')?.click()}
                >
                  <input
                    id="quick-mileage-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleQuickPhotoChange(file, setQuickMileageReceiptPhoto);
                      }
                    }}
                    className="hidden"
                  />
                  <Camera className="h-5 w-5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">Upload Photo</span>
                  {quickMileageReceiptPhoto ? (
                    <div className="mt-2 flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm max-w-xs" onClick={(e) => e.stopPropagation()}>
                      <img src={quickMileageReceiptPhoto} alt="Preview" className="h-8 w-8 object-cover rounded-md" />
                      <span className="text-xs text-emerald-600 font-bold truncate">Photo Attached</span>
                      <button 
                        type="button" 
                        onClick={() => setQuickMileageReceiptPhoto('')} 
                        className="text-slate-400 hover:text-rose-500 font-semibold text-xs ml-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">JPEG/PNG, Max 1.5MB</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                id="update-mileage-cancel-btn"
                onClick={() => {
                  setShowUpdateMileageModal(false);
                  setUpdateMileageError('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="update-mileage-submit-btn"
                onClick={() => {
                  if (!updateMileageVehicleId) {
                    setUpdateMileageError('Please select a vehicle');
                    return;
                  }
                  if (newMileageValue === '' || newMileageValue < 0) {
                    setUpdateMileageError('Please enter a valid odometer reading');
                    return;
                  }
                  
                  // Add the odometer log entry (it will trigger the dynamic odometer synchronization useEffect)
                  handleAddLog({
                    vehicleId: updateMileageVehicleId,
                    date: newMileageDate || new Date().toISOString().split('T')[0],
                    serviceType: 'Odometer Update',
                    title: 'Odometer Reading',
                    odometer: Number(newMileageValue),
                    cost: 0,
                    provider: 'User Update',
                    notes: newMileageNotes || '',
                    status: 'Completed',
                    receiptPhoto: quickMileageReceiptPhoto || undefined
                  });
                  setShowUpdateMileageModal(false);
                  setUpdateMileageError('');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                Save Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK FUEL REFILL MODAL */}
      {showQuickFuelModal && (
        <div id="quick-fuel-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="quick-fuel-modal-container" className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col relative">
            <button
              id="quick-fuel-modal-close-btn"
              onClick={() => {
                setShowQuickFuelModal(false);
                setQuickFuelError('');
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Droplet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">Record Fuel Refill</h3>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-800">
              {quickFuelError && (
                <div id="quick-fuel-error-alert" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{quickFuelError}</span>
                </div>
              )}

              {vehicles.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500 font-semibold">
                  Please add a vehicle in the <strong className="text-indigo-600">Garage</strong> tab first to track fuel entries.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Checkbox */}
                  <label className="flex items-center gap-2.5 cursor-pointer py-1.5 border-b border-slate-100 pb-2.5">
                    <input
                      id="quick-fuel-fulltank-checkbox"
                      type="checkbox"
                      checked={quickFuelFullTank}
                      onChange={(e) => setQuickFuelFullTank(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4.5 w-4.5"
                    />
                    <span className="text-xs text-slate-600 font-bold">Filled to Full Tank (recommended for exact mileage tracking)</span>
                  </label>

                  {/* Vehicle Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Select Vehicle</label>
                    <select
                      id="quick-fuel-vehicle-select"
                      value={quickFuelVehicleId}
                      onChange={(e) => {
                        const vehId = e.target.value;
                        setQuickFuelVehicleId(vehId);
                        setQuickFuelOdometer('');
                      }}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.year} {v.make} {v.model}) - {v.licensePlate}
                        </option>
                      ))}
                    </select>
                  </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Date */}
                     <div className="space-y-1 min-w-0">
                       <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Refill Date</label>
                       <input
                         id="quick-fuel-date-input"
                         type="date"
                         value={quickFuelDate}
                         onChange={(e) => setQuickFuelDate(e.target.value)}
                         className="w-full h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold min-w-0"
                       />
                     </div>
 
                     {/* Odometer */}
                     <div className="space-y-1 min-w-0">
                       <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Odometer ({preferences.distanceUnit})</label>
                       <input
                         id="quick-fuel-odometer-input"
                         type="text"
                         placeholder="Reading during fuel refill"
                         value={formatNumberWithCommas(quickFuelOdometer)}
                         onChange={(e) => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { setQuickFuelOdometer(rawVal); } }}
                         className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold min-w-0"
                       />
                     </div>
                   </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Fuel Volume */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Volume ({preferences.volumeUnit})</label>
                      <input
                        id="quick-fuel-volume-input"
                        type="text"
                        placeholder="0.00"
                        value={formatNumberWithCommas(quickFuelVolume)}
                        onChange={(e) => {
                          const rawVal = parseNumberFromCommas(e.target.value);
                          if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) {
                            handleQuickFuelVolumeChange(rawVal);
                          }
                        }}
                        onBlur={() => {
                          if (quickFuelVolume !== '') {
                            setQuickFuelVolume(Number(quickFuelVolume).toFixed(2));
                          }
                        }}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    {/* Price Per Unit */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">PRICE ({preferences.currency || 'USD'}/{preferences.volumeUnit})</label>
                      <input
                        id="quick-fuel-price-input"
                        type="text"
                        placeholder="0.00"
                        value={formatNumberWithCommas(quickFuelPricePerUnit)}
                        onChange={(e) => {
                          const rawVal = parseNumberFromCommas(e.target.value);
                          if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) {
                            handleQuickFuelPriceChange(rawVal);
                          }
                        }}
                        onBlur={() => {
                          if (quickFuelPricePerUnit !== '') {
                            setQuickFuelPricePerUnit(Number(quickFuelPricePerUnit).toFixed(2));
                          }
                        }}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    {/* Total Cost */}
                    <div className="space-y-1 col-span-1 sm:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Cost</label>
                      <input
                        id="quick-fuel-cost-input"
                        type="text"
                        placeholder="0.00"
                        value={formatNumberWithCommas(quickFuelTotalCost)}
                        onChange={(e) => {
                          const rawVal = parseNumberFromCommas(e.target.value);
                          if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) {
                            handleQuickFuelCostChange(rawVal);
                          }
                        }}
                        onBlur={() => {
                          if (quickFuelTotalCost !== '') {
                            setQuickFuelTotalCost(Number(quickFuelTotalCost).toFixed(2));
                          }
                        }}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Gas Station */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Gas Station Name</label>
                      <input
                        id="quick-fuel-station-input"
                        type="text"
                        placeholder="e.g. Shell, Chevron"
                        value={quickFuelGasStation}
                        onChange={(e) => setQuickFuelGasStation(e.target.value)}
                        list="quick-stations-list"
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                      <datalist id="quick-stations-list">
                        {getGasStationSuggestions(refills).map(station => (
                          <option key={station} value={station} />
                        ))}
                      </datalist>
                    </div>

                    {/* Fuel Brand */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Fuel Brand</label>
                      <input
                        id="quick-fuel-brand-input"
                        type="text"
                        placeholder="e.g. Regular unleaded, Premium"
                        value={quickFuelFuelBrand}
                        onChange={(e) => setQuickFuelFuelBrand(e.target.value)}
                        list="quick-brands-list"
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                      <datalist id="quick-brands-list">
                        {getFuelBrandSuggestions(refills).map(brand => (
                          <option key={brand} value={brand} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Notes / Trip Log</label>
                    <textarea
                      id="quick-fuel-notes-input"
                      placeholder="Special details about driving conditions, load, tire pressures, etc. (Optional)"
                      value={quickFuelNotes}
                      onChange={(e) => setQuickFuelNotes(e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Receipt Photo (Optional)</label>
                    <div 
                      className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition gap-2 text-center cursor-pointer relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          handleQuickPhotoChange(file, setQuickFuelReceiptPhoto);
                        }
                      }}
                      onClick={() => document.getElementById('quick-fuel-photo-input')?.click()}
                    >
                      <input
                        id="quick-fuel-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleQuickPhotoChange(file, setQuickFuelReceiptPhoto);
                          }
                        }}
                        className="hidden"
                      />
                      <Camera className="h-5 w-5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Upload Photo</span>
                      {quickFuelReceiptPhoto ? (
                        <div className="mt-2 flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm max-w-xs" onClick={(e) => e.stopPropagation()}>
                          <img src={quickFuelReceiptPhoto} alt="Preview" className="h-8 w-8 object-cover rounded-md" />
                          <span className="text-xs text-emerald-600 font-bold truncate">Photo Attached</span>
                          <button 
                            type="button" 
                            onClick={() => setQuickFuelReceiptPhoto('')} 
                            className="text-slate-400 hover:text-rose-500 font-semibold text-xs ml-1 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">JPEG/PNG, Max 1.5MB</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                id="quick-fuel-cancel-btn"
                onClick={() => {
                  setShowQuickFuelModal(false);
                  setQuickFuelError('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              {vehicles.length > 0 && (
                <button
                  id="quick-fuel-submit-btn"
                  onClick={() => {
                    if (!quickFuelVehicleId) {
                      setQuickFuelError('Please select a vehicle');
                      return;
                    }
                    if (!quickFuelDate) {
                      setQuickFuelError('Date is required');
                      return;
                    }
                    if (quickFuelOdometer === '' || Number(quickFuelOdometer) <= 0) {
                      setQuickFuelError('Odometer reading is required');
                      return;
                    }
                    if (quickFuelVolume === '' || Number(quickFuelVolume) <= 0) {
                      setQuickFuelError('Fuel volume is required');
                      return;
                    }
                    if (quickFuelPricePerUnit === '' || Number(quickFuelPricePerUnit) <= 0) {
                      setQuickFuelError('Price per unit is required');
                      return;
                    }
                    if (quickFuelTotalCost === '' || Number(quickFuelTotalCost) <= 0) {
                      setQuickFuelError('Total cost is required');
                      return;
                    }

                    // Validation of odometer value
                    const vehicleRefills = refills.filter(r => r.vehicleId === quickFuelVehicleId);
                    if (vehicleRefills.length > 0) {
                      const highestOdo = Math.max(...vehicleRefills.map(r => r.odometer));
                      if (Number(quickFuelOdometer) <= highestOdo) {
                        setQuickFuelError(`Odometer of ${Number(quickFuelOdometer).toLocaleString()} is lower or equal to previous logged refill of ${highestOdo.toLocaleString()} ${preferences.distanceUnit}.`);
                        return;
                      }
                    }

                    if (quickFuelGasStation.trim()) {
                      saveGasStationEntry(quickFuelGasStation.trim());
                    }
                    if (quickFuelFuelBrand.trim()) {
                      saveFuelBrandEntry(quickFuelFuelBrand.trim());
                    }

                    handleAddRefill({
                      vehicleId: quickFuelVehicleId,
                      date: quickFuelDate,
                      odometer: Number(quickFuelOdometer),
                      volume: Number(Number(quickFuelVolume).toFixed(2)),
                      pricePerUnit: Number(Number(quickFuelPricePerUnit).toFixed(2)),
                      totalCost: Number(Number(quickFuelTotalCost).toFixed(2)),
                      fullTank: quickFuelFullTank,
                      gasStation: quickFuelGasStation.trim() || undefined,
                      fuelBrand: quickFuelFuelBrand.trim() || undefined,
                      notes: quickFuelNotes.trim() || undefined,
                      receiptPhoto: quickFuelReceiptPhoto || undefined
                    });

                    setShowQuickFuelModal(false);
                    setQuickFuelError('');
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  Save Log
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK RECORD SERVICE MODAL */}
      {showQuickMaintModal && (
        <div id="quick-maint-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="quick-maint-modal-container" className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col relative">
            <button
              id="quick-maint-modal-close-btn"
              onClick={() => {
                setShowQuickMaintModal(false);
                setQuickMaintError('');
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">Record Service</h3>
                  
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-800">
              {quickMaintError && (
                <div id="quick-maint-error-alert" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{quickMaintError}</span>
                </div>
              )}

              {vehicles.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500 font-semibold">
                  Please add a vehicle in the <strong className="text-indigo-600">Garage</strong> tab first to track service logs.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Toggle (Completed vs Scheduled) */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Log Status</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                      <button
                        id="quick-maint-status-completed"
                        type="button"
                        onClick={() => setQuickMaintStatus('Completed')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          quickMaintStatus === 'Completed'
                            ? 'bg-white border border-slate-200/80 shadow-sm text-slate-950'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        ● Service Completed
                      </button>
                      <button
                        id="quick-maint-status-scheduled"
                        type="button"
                        onClick={() => setQuickMaintStatus('Scheduled')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          quickMaintStatus === 'Scheduled'
                            ? 'bg-white border border-slate-200/80 shadow-sm text-slate-950'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Plan / Schedule
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Vehicle</label>
                    <select
                      id="quick-maint-vehicle-select"
                      value={quickMaintVehicleId}
                      onChange={(e) => {
                        const vehId = e.target.value;
                        setQuickMaintVehicleId(vehId);
                        setQuickMaintOdometer('');
                      }}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.year} {v.make} {v.model}) - {v.licensePlate}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {/* Service Type */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Service Category</label>
                      <input
                        id="quick-maint-service-type-input"
                        type="text"
                        placeholder="e.g. Oil Change, Tires"
                        value={quickMaintServiceType}
                        onChange={(e) => setQuickMaintServiceType(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    {/* Service Notes / Remarks */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Service Notes / Remarks</label>
                      <textarea
                        id="quick-maint-notes-input"
                        placeholder="e.g. Replaced oil filter, checked cabin filters, visual safety inspection notes... (Optional)"
                        value={quickMaintNotes}
                        onChange={(e) => setQuickMaintNotes(e.target.value)}
                        rows={2}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                      />
                    </div>
                  </div>

                  {/* Scheduled Specifics */}
                  {quickMaintStatus === 'Scheduled' && (
                    <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                      <label className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">Alert based on:</label>
                      <select
                        id="quick-maint-schedule-type"
                        value={quickMaintScheduleType}
                        onChange={(e: any) => setQuickMaintScheduleType(e.target.value)}
                        className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="Calendar-and-Mileage">Calendar and Mileage (Whichever comes first)</option>
                        <option value="Calendar-Only">Calendar Only</option>
                        <option value="Mileage-Only">Mileage Only</option>
                      </select>
                    </div>
                  )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Date Performed / Date Scheduled */}
                     {!(quickMaintStatus === 'Scheduled' && quickMaintScheduleType === 'Mileage-Only') && (
                       <div className="space-y-1 min-w-0">
                         <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                           {quickMaintStatus === 'Completed' ? 'Date Performed' : 'Scheduled Date'}
                         </label>
                         <input
                           id="quick-maint-date-input"
                           type="date"
                           value={quickMaintDate}
                           onChange={(e) => setQuickMaintDate(e.target.value)}
                           className="w-full h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold min-w-0"
                         />
                       </div>
                     )}
 
                     {/* Odometer */}
                     {!(quickMaintStatus === 'Scheduled' && quickMaintScheduleType === 'Calendar-Only') && (
                       <div className="space-y-1 col-span-1 min-w-0">
                         <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                           {quickMaintStatus === 'Completed' ? `Odometer (${preferences.distanceUnit})` : `Target Odometer (${preferences.distanceUnit})`}
                         </label>
                         <input
                           id="quick-maint-odometer-input"
                           type="text"
                           placeholder="Reading during service"
                           value={formatNumberWithCommas(quickMaintOdometer)}
                           onChange={(e) => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { setQuickMaintOdometer(rawVal); } }}
                           className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold min-w-0"
                         />
                       </div>
                     )}
                   </div>

                  {quickMaintStatus === 'Completed' && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Cost */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Cost (${preferences.currency || 'USD'})</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{getCurrencySymbol(preferences.currency)}</span>
                          <input
                            id="quick-maint-cost-input"
                            type="text"
                            placeholder="0.00"
                            value={formatNumberWithCommas(quickMaintCost)}
                            onChange={(e) => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { setQuickMaintCost(rawVal); } }}
                            className="w-full h-11 pl-7 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Provider */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Service Provider</label>
                        <input
                          id="quick-maint-provider-input"
                          type="text"
                          placeholder="e.g. Local Shop, Self"
                          value={quickMaintProvider}
                          onChange={(e) => setQuickMaintProvider(e.target.value)}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Photo Upload */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Service Photo (Optional)</label>
                    <div 
                      className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition gap-2 text-center cursor-pointer relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          handleQuickPhotoChange(file, setQuickMaintReceiptPhoto);
                        }
                      }}
                      onClick={() => document.getElementById('quick-maint-photo-input')?.click()}
                    >
                      <input
                        id="quick-maint-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleQuickPhotoChange(file, setQuickMaintReceiptPhoto);
                          }
                        }}
                        className="hidden"
                      />
                      <Camera className="h-5 w-5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Upload Photo</span>
                      {quickMaintReceiptPhoto ? (
                        <div className="mt-2 flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm max-w-xs" onClick={(e) => e.stopPropagation()}>
                          <img src={quickMaintReceiptPhoto} alt="Preview" className="h-8 w-8 object-cover rounded-md" />
                          <span className="text-xs text-emerald-600 font-bold truncate">Photo Attached</span>
                          <button 
                            type="button" 
                            onClick={() => setQuickMaintReceiptPhoto('')} 
                            className="text-slate-400 hover:text-rose-500 font-semibold text-xs ml-1 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">JPEG/PNG, Max 1.5MB</span>
                      )}
                    </div>
                  </div>

                  {/* Recurrence Trigger for Completed Services */}
                  {quickMaintStatus === 'Completed' && (
                    <div className="p-3.5 border border-slate-150 rounded-2xl space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="quick-maint-recurrence-checkbox"
                          type="checkbox"
                          checked={quickMaintHasRecurrence}
                          onChange={(e) => setQuickMaintHasRecurrence(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4.5 w-4.5"
                        />
                        <span className="text-xs text-slate-700 font-bold">Schedule next recurring alert for this service</span>
                      </label>

                      {quickMaintHasRecurrence && (
                        <div className="grid grid-cols-1 gap-3 pt-1 border-t border-slate-100 space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alert based on:</label>
                            <select
                              id="quick-maint-rec-type"
                              value={quickMaintScheduleType}
                              onChange={(e: any) => setQuickMaintScheduleType(e.target.value)}
                              className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                            >
                              <option value="Calendar-and-Mileage">Calendar and Mileage (Whichever comes first)</option>
                              <option value="Calendar-Only">Calendar Only</option>
                              <option value="Mileage-Only">Mileage Only</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Next Date */}
                            {quickMaintScheduleType !== 'Mileage-Only' && (
                              <div className="space-y-1 min-w-0">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Due Date</label>
                                <input
                                  id="quick-maint-next-date"
                                  type="date"
                                  value={quickMaintNextDueDate}
                                  onChange={(e) => setQuickMaintNextDueDate(e.target.value)}
                                  className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold min-w-0"
                                />
                              </div>
                            )}

                            {/* Next Odometer */}
                            {quickMaintScheduleType !== 'Calendar-Only' && (
                              <div className="space-y-1 min-w-0">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Due Odometer ({preferences.distanceUnit})</label>
                                <input
                                  id="quick-maint-next-odo"
                                  type="text"
                                  placeholder="Due mileage"
                                  value={formatNumberWithCommas(quickMaintNextDueOdometer)}
                                  onChange={(e) => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { setQuickMaintNextDueOdometer(rawVal); } }}
                                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold min-w-0"
                                />
                              </div>
                            )}
                          </div>

                          {/* Service Notes inside Recurrence alert group */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Service Notes / Remarks</label>
                            <textarea
                              id="quick-maint-recurrence-notes-input"
                              placeholder="e.g. Service notes / remarks for next recurrence... (Optional)"
                              value={quickMaintNotes}
                              onChange={(e) => setQuickMaintNotes(e.target.value)}
                              rows={2}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                id="quick-maint-cancel-btn"
                onClick={() => {
                  setShowQuickMaintModal(false);
                  setQuickMaintError('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              {vehicles.length > 0 && (
                <button
                  id="quick-maint-submit-btn"
                  onClick={() => {
                    if (!quickMaintVehicleId) {
                      setQuickMaintError('Please select a vehicle');
                      return;
                    }
                    if (!quickMaintServiceType.trim()) {
                      setQuickMaintError('Service is required');
                      return;
                    }

                    if (quickMaintStatus === 'Completed') {
                      if (!quickMaintDate) {
                        setQuickMaintError('Service Date is required');
                        return;
                      }
                      if (quickMaintOdometer === '' || Number(quickMaintOdometer) < 0) {
                        setQuickMaintError('Odometer Reading is required');
                        return;
                      }

                      if (quickMaintHasRecurrence) {
                        if (quickMaintScheduleType === 'Calendar-and-Mileage') {
                          if (!quickMaintNextDueDate) {
                            setQuickMaintError('Next service date is required');
                            return;
                          }
                          if (quickMaintNextDueOdometer === '' || Number(quickMaintNextDueOdometer) < 0) {
                            setQuickMaintError('Next odometer reading is required');
                            return;
                          }
                        } else if (quickMaintScheduleType === 'Calendar-Only') {
                          if (!quickMaintNextDueDate) {
                            setQuickMaintError('Next service date is required');
                            return;
                          }
                        } else if (quickMaintScheduleType === 'Mileage-Only') {
                          if (quickMaintNextDueOdometer === '' || Number(quickMaintNextDueOdometer) < 0) {
                            setQuickMaintError('Next odometer reading is required');
                            return;
                          }
                        }
                      }
                    } else {
                      // status === 'Scheduled'
                      if (quickMaintScheduleType === 'Calendar-and-Mileage') {
                        if (!quickMaintDate) {
                          setQuickMaintError('Scheduled Date is required');
                          return;
                        }
                        if (quickMaintOdometer === '' || Number(quickMaintOdometer) < 0) {
                          setQuickMaintError('Target odometer reading is required');
                          return;
                        }
                      } else if (quickMaintScheduleType === 'Calendar-Only') {
                        if (!quickMaintDate) {
                          setQuickMaintError('Scheduled Date is required');
                          return;
                        }
                      } else if (quickMaintScheduleType === 'Mileage-Only') {
                        if (quickMaintOdometer === '' || Number(quickMaintOdometer) < 0) {
                          setQuickMaintError('Target odometer reading is required');
                          return;
                        }
                      }
                    }

                    const finalTitle = quickMaintTitle.trim() || quickMaintServiceType.trim();
                    const finalCost = quickMaintCost === '' ? 0 : Number(quickMaintCost);

                    handleAddLog({
                      vehicleId: quickMaintVehicleId,
                      date: (quickMaintStatus === 'Scheduled' && quickMaintScheduleType === 'Mileage-Only') ? '' : quickMaintDate,
                      serviceType: quickMaintServiceType.trim(),
                      title: finalTitle,
                      odometer: (quickMaintStatus === 'Scheduled' && quickMaintScheduleType === 'Calendar-Only') ? 0 : Number(quickMaintOdometer),
                      cost: finalCost,
                      provider: quickMaintProvider.trim() || 'Self / General',
                      notes: quickMaintNotes.trim() || undefined,
                      status: quickMaintStatus,
                      nextDueDate: (quickMaintStatus === 'Completed' && quickMaintHasRecurrence && quickMaintScheduleType !== 'Mileage-Only') ? quickMaintNextDueDate : undefined,
                      nextDueOdometer: (quickMaintStatus === 'Completed' && quickMaintHasRecurrence && quickMaintScheduleType !== 'Calendar-Only' && quickMaintNextDueOdometer !== '') ? Number(quickMaintNextDueOdometer) : undefined,
                      receiptPhoto: quickMaintReceiptPhoto || undefined
                    });

                    setShowQuickMaintModal(false);
                    setQuickMaintError('');
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  Save Service
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </MobileFrame>
  );
}
