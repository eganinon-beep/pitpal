import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Plus, Trash2, Calendar, FileText, Check, X, Edit, Gauge, Truck, Bike, Droplet, Wrench, Bus, Camera, ImageIcon, Pipette } from 'lucide-react';
import { Vehicle, FuelRefill, MaintenanceLog, UserPreferences } from '../types';
import { formatCurrency, getVehiclesColorMap, formatDate } from '../utils';
import FuelTab from './FuelTab';
import MaintenanceTab from './MaintenanceTab';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  refills: FuelRefill[];
  maintenanceLogs: MaintenanceLog[];
  preferences: UserPreferences;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  onDeleteVehicle: (id: string) => void;
  onEditVehicle: (id: string, updates: Partial<Vehicle>) => void;
  onAddRefill: (refill: Omit<FuelRefill, 'id'>) => void;
  onDeleteRefill: (id: string) => void;
  onEditRefill: (id: string, updates: Partial<FuelRefill>) => void;
  onAddLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  onUpdateStatus: (id: string, updates: Partial<MaintenanceLog>) => void;
  onDeleteLog: (id: string) => void;
  onEditLog: (id: string, updates: Partial<MaintenanceLog>) => void;
  
  selectedDetailVehicleId: string | null;
  setSelectedDetailVehicleId: (id: string | null) => void;
  detailSubTab: 'refills' | 'services';
  setDetailSubTab: (tab: 'refills' | 'services') => void;
  showAddFormInDetail: boolean;
  setShowAddFormInDetail: (show: boolean) => void;
  onShowAddFormChange?: (show: boolean) => void;
  initialSelectedActivityId?: { id: string, type: 'refill' | 'maintenance' | 'odometer' } | null;
  setInitialSelectedActivityId?: (val: { id: string, type: 'refill' | 'maintenance' | 'odometer' } | null) => void;
}

const VEHICLE_COLORS = [
  '#0ea5e9', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#ec4899', // Pink
];

export const VEHICLE_TYPES = ['AUV', 'Bus', 'Convertible', 'Coupe', 'Crossover', 'Hatchback', 'Motorcycle', 'MPV', 'Pickup Truck', 'Sedan', 'SUV', 'Truck', 'Van', 'Other'];
export const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other'];

export function PickupTruckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Wheels */}
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      
      {/* Body outline */}
      <path d="M5 18H2V13h9V8h4.5l3.5 5h3v4a1 1 0 0 1-1 1h-2" />
      
      {/* Bottom chassis line between wheels */}
      <path d="M9 18h6" />
      
      {/* Cab and Bed separation line */}
      <path d="M11 13v5" />
      
      {/* Cab window */}
      <path d="M12 12V10h2.5l1.5 2Z" />
    </svg>
  );
}

export function getVehicleIcon(vehicleType?: string, className: string = "h-5 w-5") {
  const type = (vehicleType || '').toLowerCase();
  switch (type) {
    case 'pick-up truck':
    case 'pickup truck':
      return <PickupTruckIcon className={className} />;
    case 'truck':
      return <Truck className={className} />;
    case 'motorcycle':
      return <Bike className={className} />;
    case 'van':
      return <Truck className={className} />;
    case 'bus':
      return <Bus className={className} />;
    default:
      return <Car className={className} />;
  }
}

export default function VehiclesTab({
  vehicles,
  refills,
  maintenanceLogs,
  preferences,
  onAddVehicle,
  onDeleteVehicle,
  onEditVehicle,
  onAddRefill,
  onDeleteRefill,
  onEditRefill,
  onAddLog,
  onUpdateStatus,
  onDeleteLog,
  onEditLog,
  selectedDetailVehicleId,
  setSelectedDetailVehicleId,
  detailSubTab,
  setDetailSubTab,
  showAddFormInDetail,
  setShowAddFormInDetail,
  onShowAddFormChange,
  initialSelectedActivityId,
  setInitialSelectedActivityId
 }: VehiclesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  React.useEffect(() => {
    onShowAddFormChange?.(showAddForm);
  }, [showAddForm, onShowAddFormChange]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [fuelType, setFuelType] = useState('Gasoline');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState<number | ''>('');
  const [color, setColor] = useState(VEHICLE_COLORS[0]);
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');

  // Editing state variables
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [editName, setEditName] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('Sedan');
  const [editFuelType, setEditFuelType] = useState('Gasoline');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState(new Date().getFullYear());
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [editCurrentOdometer, setEditCurrentOdometer] = useState<number | ''>('');
  const [editColor, setEditColor] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFormError, setEditFormError] = useState('');

  const handleStartEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setEditName(v.name);
    setEditVehicleType(v.vehicleType || 'Sedan');
    setEditFuelType(v.fuelType || 'Gasoline');
    setEditMake(v.make || '');
    setEditModel(v.model || '');
    setEditYear(v.year);
    setEditLicensePlate(v.licensePlate || '');
    setEditCurrentOdometer(v.currentOdometer);
    setEditColor(v.color);
    setEditNotes(v.notes || '');
    setEditFormError('');
  };

  // Activity Detail View / Edit States
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [activityFormError, setActivityFormError] = useState('');
  const [deleteActivityConfirm, setDeleteActivityConfirm] = useState<{ id: string, type: 'refill' | 'maintenance' | 'odometer' } | null>(null);
  const [selectedActivityPhoto, setSelectedActivityPhoto] = useState<string | null>(null);

  // States for selected activity's editable fields
  const [actDate, setActDate] = useState('');
  const [actOdometer, setActOdometer] = useState<number | ''>('');
  const [actNotes, setActNotes] = useState('');
  
  // Fuel Refill specific fields
  const [actVolume, setActVolume] = useState<number | ''>('');
  const [actPricePerUnit, setActPricePerUnit] = useState<number | ''>('');
  const [actTotalCost, setActTotalCost] = useState<number | ''>('');
  const [actGasStation, setActGasStation] = useState('');
  const [actFuelBrand, setActFuelBrand] = useState('');
  const [actFullTank, setActFullTank] = useState(true);

  // Service Log specific fields
  const [actServiceType, setActServiceType] = useState('');
  const [actTitle, setActTitle] = useState('');
  const [actCost, setActCost] = useState<number | ''>('');
  const [actProvider, setActProvider] = useState('');
  const [actStatus, setActStatus] = useState<'Scheduled' | 'Completed'>('Completed');
  const [actNextDueDate, setActNextDueDate] = useState('');
  const [actNextDueOdometer, setActNextDueOdometer] = useState<number | ''>('');
  const [actReceiptPhoto, setActReceiptPhoto] = useState('');

  const handleActivityClick = (item: any) => {
    if (item.type === 'refill') {
      const originalRefill = refills.find(r => r.id === item.id);
      if (!originalRefill) return;
      setSelectedActivity({ ...originalRefill, type: 'refill' });
      setIsEditingActivity(false);
      setActivityFormError('');
      
      setActDate(originalRefill.date);
      setActOdometer(originalRefill.odometer);
      setActNotes(originalRefill.notes || '');
      setActVolume(originalRefill.volume);
      setActPricePerUnit(originalRefill.pricePerUnit);
      setActTotalCost(originalRefill.totalCost);
      setActGasStation(originalRefill.gasStation || '');
      setActFuelBrand(originalRefill.fuelBrand || '');
      setActFullTank(originalRefill.fullTank);
      setActReceiptPhoto(originalRefill.receiptPhoto || '');
    } else {
      const originalLog = maintenanceLogs.find(m => m.id === item.id);
      if (!originalLog) return;
      setSelectedActivity({ ...originalLog, type: item.type });
      setIsEditingActivity(false);
      setActivityFormError('');
      
      setActDate(originalLog.date);
      setActOdometer(originalLog.odometer);
      setActNotes(originalLog.notes || '');
      setActServiceType(originalLog.serviceType);
      setActTitle(originalLog.title || '');
      setActCost(originalLog.cost);
      setActProvider(originalLog.provider || '');
      setActStatus(originalLog.status);
      setActNextDueDate(originalLog.nextDueDate || '');
      setActNextDueOdometer(originalLog.nextDueOdometer !== undefined ? originalLog.nextDueOdometer : '');
      setActReceiptPhoto(originalLog.receiptPhoto || '');
    }
  };

  React.useEffect(() => {
    if (initialSelectedActivityId) {
      const { id, type } = initialSelectedActivityId;
      handleActivityClick({ id, type });
      setInitialSelectedActivityId?.(null);
    }
  }, [initialSelectedActivityId, refills, maintenanceLogs]);

  const handleActivityPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
            setActReceiptPhoto(compressedUrl);
          } else {
            setActReceiptPhoto(imgUrl);
          }
        };
      } else {
        setActReceiptPhoto(imgUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveActivityEdit = () => {
    if (!selectedActivity) return;
    
    if (!actDate) {
      setActivityFormError('Date is required');
      return;
    }
    if (actOdometer === '' || Number(actOdometer) < 0) {
      setActivityFormError('Valid odometer is required');
      return;
    }

    if (selectedActivity.type === 'refill') {
      if (actVolume === '' || Number(actVolume) <= 0) {
        setActivityFormError('Valid volume is required');
        return;
      }
      if (actPricePerUnit === '' || Number(actPricePerUnit) <= 0) {
        setActivityFormError('Valid price per unit is required');
        return;
      }
      
      const calculatedTotal = Number(actTotalCost) || (Number(actVolume) * Number(actPricePerUnit));
      
      onEditRefill(selectedActivity.id, {
        date: actDate,
        odometer: Number(actOdometer),
        volume: Number(actVolume),
        pricePerUnit: Number(actPricePerUnit),
        totalCost: Number(calculatedTotal),
        gasStation: actGasStation,
        fuelBrand: actFuelBrand,
        fullTank: actFullTank,
        notes: actNotes,
        receiptPhoto: actReceiptPhoto || undefined
      });
    } else {
      if (selectedActivity.type === 'maintenance' && !actServiceType.trim()) {
        setActivityFormError('Service name is required');
        return;
      }

      onEditLog(selectedActivity.id, {
        date: actDate,
        serviceType: selectedActivity.type === 'odometer' ? 'Odometer Update' : actServiceType,
        title: selectedActivity.type === 'odometer' ? 'Odometer Reading' : actTitle,
        odometer: Number(actOdometer),
        cost: selectedActivity.type === 'odometer' ? 0 : Number(actCost || 0),
        provider: selectedActivity.type === 'odometer' ? 'User Update' : actProvider,
        status: actStatus,
        notes: actNotes,
        nextDueDate: actNextDueDate || undefined,
        nextDueOdometer: actNextDueOdometer !== '' ? Number(actNextDueOdometer) : undefined,
        receiptPhoto: actReceiptPhoto || undefined
      });
    }

    setSelectedActivity(null);
    setIsEditingActivity(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVehicle) return;
    if (!editName.trim()) return setEditFormError('Vehicle Name is required');
    if (editCurrentOdometer === '' || editCurrentOdometer < 0) return setEditFormError('Please enter a valid odometer reading');
    
    onEditVehicle(editVehicle.id, {
      name: editName.trim(),
      vehicleType: editVehicleType,
      fuelType: editFuelType,
      make: editMake.trim(),
      model: editModel.trim(),
      year: editYear || new Date().getFullYear(),
      licensePlate: editLicensePlate.trim().toUpperCase(),
      startingOdometer: Number(editCurrentOdometer),
      currentOdometer: Number(editCurrentOdometer),
      color: editColor,
      notes: editNotes.trim() || undefined
    });

    setEditVehicle(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setFormError('Vehicle Name is required');
    if (currentOdometer === '' || currentOdometer < 0) return setFormError('Please enter a valid starting odometer');
    
    onAddVehicle({
      name: name.trim(),
      vehicleType,
      fuelType,
      make: make.trim(),
      model: model.trim(),
      year: year || new Date().getFullYear(),
      licensePlate: licensePlate.trim().toUpperCase(),
      startingOdometer: Number(currentOdometer),
      currentOdometer: Number(currentOdometer),
      color,
      notes: notes.trim() || undefined
    });

    // Reset Form
    setName('');
    setVehicleType('Sedan');
    setFuelType('Gasoline');
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setLicensePlate('');
    setCurrentOdometer('');
    setColor(VEHICLE_COLORS[0]);
    setNotes('');
    setFormError('');
    setShowAddForm(false);
  };

  // Lifetime summaries helper
  const getVehicleStats = (vId: string) => {
    const vRefills = refills.filter(r => r.vehicleId === vId);
    const vMaint = maintenanceLogs.filter(m => m.vehicleId === vId && m.status === 'Completed');
    
    const fuelSpend = vRefills.reduce((sum, r) => sum + r.totalCost, 0);
    const maintSpend = vMaint.reduce((sum, m) => sum + m.cost, 0);
    
    return {
      fuelSpend,
      maintSpend,
      totalSpend: fuelSpend + maintSpend,
      refillCount: vRefills.length,
      serviceCount: vMaint.length
    };
  };

  const renderVehicleDetails = () => {
    if (!selectedDetailVehicleId) return null;
    const v = vehicles.find(veh => veh.id === selectedDetailVehicleId);
    if (v) {
      const stats = getVehicleStats(v.id);
      const colorScheme = getVehiclesColorMap(v.color);

      // 1. Gather refills
      const vehicleRefills = refills.filter(r => r.vehicleId === v.id);
      
      // 2. Gather maintenance logs
      const vehicleLogs = maintenanceLogs.filter(m => m.vehicleId === v.id);

      // 3. Construct unified items
      interface UnifiedLogItem {
        type: 'refill' | 'maintenance' | 'odometer';
        id: string;
        date: string;
        odometer: number;
        cost: number;
        title: string;
        subtitle: string;
        notes?: string;
        status?: 'Scheduled' | 'Completed';
        volume?: number;
        pricePerUnit?: number;
        serviceType?: string;
      }

      const unifiedItems: UnifiedLogItem[] = [
        ...vehicleRefills.map(r => ({
          type: 'refill' as const,
          id: r.id,
          date: r.date,
          odometer: r.odometer,
          cost: r.totalCost,
          title: 'Fuel Refill',
          subtitle: `${r.volume} ${preferences.volumeUnit} • ${formatCurrency(r.pricePerUnit, preferences.currency)}/${preferences.volumeUnit}`,
          notes: r.notes,
          volume: r.volume,
          pricePerUnit: r.pricePerUnit
        })),
        ...vehicleLogs.map(m => {
          const isOdometerUpdate = m.serviceType === 'Odometer Update';
          const cleanNotes = (m.notes === 'Manual odometer update.' || m.notes === 'Manual odometer update') ? '' : m.notes;
          return {
            type: isOdometerUpdate ? ('odometer' as const) : ('maintenance' as const),
            id: m.id,
            date: m.date,
            odometer: m.odometer,
            cost: m.cost,
            title: isOdometerUpdate ? 'Odometer Reading' : m.serviceType,
            subtitle: isOdometerUpdate ? '' : (m.title === 'Odometer Reading Updated' ? '' : (m.title || m.provider || 'Vehicle Service performed')),
            notes: cleanNotes,
            status: m.status,
            serviceType: m.serviceType
          };
        })
      ];

      // Sort chronological descending (newest first)
      unifiedItems.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        if (a.type === 'odometer' && b.type !== 'odometer') return -1;
        if (b.type === 'odometer' && a.type !== 'odometer') return 1;
        return b.id.localeCompare(a.id);
      });

      return (
        <div className="space-y-6 pb-24" id="vehicle-detail-view">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              id="back-to-garage-btn"
              onClick={() => {
                setSelectedDetailVehicleId(null);
                setShowAddFormInDetail(false);
              }}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition duration-150 cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Back to Garage</span>
            </button>
            <span className="text-[10px] uppercase font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
              Active Profile
            </span>
          </div>

          {/* Vehicle summary card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 relative overflow-hidden">
            <div 
              className="absolute right-0 top-0 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
              style={{ backgroundColor: v.color }}
            />
            <div className="flex gap-3">
              <div className={`p-3 rounded-2xl shrink-0 ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`} style={colorScheme.style}>
                {getVehicleIcon(v.vehicleType)}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                  {v.name}
                  {v.licensePlate && (
                    <span className="text-[10px] text-slate-650 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      {v.licensePlate}
                    </span>
                  )}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'Standard Profile'}
                  {' • '}{[v.vehicleType, v.fuelType].filter(Boolean).join(' / ')}
                </p>
              </div>
            </div>

            {/* Substats dashboard */}
            <div className="grid grid-cols-3 gap-3.5 mt-4 pt-4 border-t border-slate-100">
              <div className="space-y-0.5">
                <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Odometer</span>
                <span className="block text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-slate-400" />
                  {v.currentOdometer.toLocaleString()} {preferences.distanceUnit}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Total spent</span>
                <span className="block text-xs font-extrabold text-indigo-600">
                  {formatCurrency(stats.totalSpend, preferences.currency)}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Activity Log</span>
                <span className="block text-xs font-bold text-slate-900">
                  {unifiedItems.length} entries
                </span>
              </div>
            </div>
          </div>

          {/* Form blocks section */}
          <AnimatePresence mode="wait">
            {showAddFormInDetail && detailSubTab === 'refills' && (
              <motion.div
                key="fuel-form-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Droplet className="h-4 w-4 text-emerald-500" /> Log Fuel Refill
                  </span>
                  <button
                    onClick={() => setShowAddFormInDetail(false)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FuelTab
                  refills={refills}
                  vehicles={[v]}
                  preferences={preferences}
                  selectedVehicleId={v.id}
                  onAddRefill={onAddRefill}
                  onDeleteRefill={onDeleteRefill}
                  showAddFormImmediately={true}
                  onCloseImmediateForm={() => setShowAddFormInDetail(false)}
                  hideList={true}
                />
              </motion.div>
            )}

            {showAddFormInDetail && detailSubTab === 'services' && (
              <motion.div
                key="service-form-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-indigo-500" /> Log Maintenance / Service
                  </span>
                  <button
                    onClick={() => setShowAddFormInDetail(false)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <MaintenanceTab
                  logs={maintenanceLogs}
                  vehicles={[v]}
                  preferences={preferences}
                  selectedVehicleId={v.id}
                  onAddLog={onAddLog}
                  onUpdateStatus={onUpdateStatus}
                  onDeleteLog={onDeleteLog}
                  showAddFormImmediately={true}
                  onCloseImmediateForm={() => setShowAddFormInDetail(false)}
                  hideList={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unified Timeline / Activities Section */}
          {!showAddFormInDetail && (
            <div className="space-y-6">
              {/* Combined activity log */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 flex justify-between items-center">
                  <span>Vehicle Activity Logbook</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {unifiedItems.length} entries
                  </span>
                </h3>

                {unifiedItems.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
                    <FileText className="h-8 w-8 text-slate-350 mx-auto" />
                    <p className="text-slate-500 text-xs font-bold">No activity logs recorded yet.</p>
                    <p className="text-slate-450 text-[10px] font-medium max-w-xs mx-auto">
                      Refill fuel, log maintenance, or update your odometer reading to build your logbook timeline.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
                    {unifiedItems.map((item) => {
                      const isRefill = item.type === 'refill';
                      const isOdometer = item.type === 'odometer';
                      const isMaintenance = item.type === 'maintenance';
                      
                      let iconColor = "bg-indigo-50 text-indigo-600 border-indigo-100";
                      let icon = <Wrench className="h-4 w-4" />;
                      
                      if (isRefill) {
                        iconColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                        icon = <Droplet className="h-4 w-4" />;
                      } else if (isOdometer) {
                        iconColor = "bg-amber-50 text-amber-500 border-amber-100";
                        icon = <Gauge className="h-4 w-4" />;
                      } else if (isMaintenance && item.status === 'Scheduled') {
                        iconColor = "bg-amber-50 text-amber-600 border-amber-100";
                        icon = <Calendar className="h-4 w-4" />;
                      }

                      return (
                        <div key={`${item.type}-${item.id}`} className="relative">
                          {/* Dot/Icon on the timeline line */}
                          <div className={`absolute -left-[35px] top-1.5 p-1.5 rounded-xl border ${iconColor} shrink-0 bg-white shadow-xs`}>
                            {icon}
                          </div>

                          {/* Content Card */}
                          <div 
                            onClick={() => handleActivityClick(item)}
                            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 shadow-xs space-y-2.5 cursor-pointer hover:shadow-md transition text-left"
                          >
                            {isOdometer && (
                              <>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-[9px] font-extrabold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded uppercase tracking-wider">
                                    Odometer Reading
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteActivityConfirm({ id: item.id, type: 'odometer' });
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                                    title="Delete Log Entry"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-slate-450" />
                                    {formatDate(item.date)}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-1">
                                    <Gauge className="h-3.5 w-3.5 text-slate-450" />
                                    {item.odometer.toLocaleString()} {preferences.distanceUnit}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-[10px] text-slate-650 bg-slate-50 p-2 rounded-xl border border-slate-100 font-semibold mt-1">
                                    {item.notes}
                                  </p>
                                )}
                              </>
                            )}

                            {isRefill && (
                              <>
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded uppercase tracking-wider">
                                    Fuel Refill
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {item.cost > 0 && (
                                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-1.5 py-0.5 rounded-lg">
                                        {formatCurrency(item.cost, preferences.currency)}
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteActivityConfirm({ id: item.id, type: 'refill' });
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                                      title="Delete Log Entry"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-slate-450" />
                                    {formatDate(item.date)}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-1">
                                    <Gauge className="h-3.5 w-3.5 text-slate-450" />
                                    {item.odometer.toLocaleString()} {preferences.distanceUnit}
                                  </span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/85 flex items-center justify-between">
                                  <span>Volume: {item.volume} {preferences.volumeUnit}</span>
                                  <span>Price: {formatCurrency(item.pricePerUnit || 0, preferences.currency)}/{preferences.volumeUnit}</span>
                                </div>
                                {item.notes && (
                                  <p className="text-[10px] text-slate-550 italic font-semibold px-1">
                                    {item.notes}
                                  </p>
                                )}
                              </>
                            )}

                            {isMaintenance && (
                              <>
                                <div className="flex justify-between items-center gap-2">
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    item.status === 'Scheduled'
                                      ? 'text-amber-700 bg-amber-50 border border-amber-100'
                                      : 'text-indigo-600 bg-indigo-50 border border-indigo-150'
                                  }`}>
                                    {item.status === 'Scheduled' ? 'Scheduled Service' : 'Completed Service'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {item.cost > 0 && (
                                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-1.5 py-0.5 rounded-lg">
                                        {formatCurrency(item.cost, preferences.currency)}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1">
                                      {item.status === 'Scheduled' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateStatus(item.id, { status: 'Completed', date: new Date().toISOString().split('T')[0] });
                                          }}
                                          className="text-[9px] bg-indigo-600 hover:bg-indigo-750 text-white font-black px-2 py-1 rounded-md transition cursor-pointer"
                                        >
                                          Mark Done
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteActivityConfirm({ id: item.id, type: 'maintenance' });
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                                        title="Delete Log Entry"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-slate-450" />
                                    {formatDate(item.date)}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-1">
                                    <Gauge className="h-3.5 w-3.5 text-slate-450" />
                                    {item.odometer.toLocaleString()} {preferences.distanceUnit}
                                  </span>
                                </div>
                                {item.serviceType && (
                                  <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100/60 p-2.5 rounded-xl text-left">
                                    Service: <span className="text-slate-800 font-extrabold">{item.serviceType}</span>
                                  </div>
                                )}
                                {item.notes && (
                                  <p className="text-[10px] text-slate-550 italic font-semibold px-1">
                                    {item.notes}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderDeleteActivityModal = () => (
    <AnimatePresence>
      {deleteActivityConfirm && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteActivityConfirm(null)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-sm relative z-50 space-y-4 shadow-2xl text-left text-slate-800"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Delete Log Entry?</h3>
            </div>
            
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Are you sure you want to delete this log entry? This action cannot be undone and will update any connected metrics.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteActivityConfirm(null)}
                className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteActivityConfirm) {
                    if (deleteActivityConfirm.type === 'refill') {
                      onDeleteRefill(deleteActivityConfirm.id);
                    } else {
                      onDeleteLog(deleteActivityConfirm.id);
                    }
                    setDeleteActivityConfirm(null);
                  }
                }}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/15"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderPhotoViewerModal = () => (
    <AnimatePresence>
      {selectedActivityPhoto && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedActivityPhoto(null)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-slate-100 rounded-3xl p-4 w-full max-w-lg relative z-50 shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Receipt Photo</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivityPhoto(null)}
                className="p-1 text-slate-450 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-slate-50 rounded-2xl p-2 min-h-0">
              <img
                src={selectedActivityPhoto}
                alt="Receipt Full View"
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-xs"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {selectedDetailVehicleId ? (
        renderVehicleDetails()
      ) : (
        <div className="space-y-6 pb-24" id="vehicles-tab-container">
      {/* Tab Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-sans tracking-tight font-bold text-slate-900">Garage</h2>
        </div>
        {!showAddForm && (
          <button
            id="toggle-add-vehicle-btn"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Vehicle
          </button>
        )}
      </div>

      {/* Add Vehicle Form Panel */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              id="add-vehicle-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddForm(false);
                setFormError('');
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-md relative z-50 space-y-4 shadow-2xl my-8 text-left text-slate-800"
              id="vehicles-add-form"
            >
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-4 w-4 text-indigo-600" /> New Vehicle Profile
            </h3>
            <button 
              id="cancel-add-vehicle-btn"
              onClick={() => {
                setShowAddForm(false);
                setFormError('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs text-center font-bold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Nickname *</label>
                <input
                  id="vehicle-name-input"
                  type="text"
                  placeholder="e.g. My Civic, Family SUV"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Vehicle Type</label>
                <select
                  id="vehicle-type-select"
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  {VEHICLE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Fuel Type</label>
                <select
                  id="vehicle-fuel-select"
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  {FUEL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Make (Optional)</label>
                <input
                  id="vehicle-make-input"
                  type="text"
                  placeholder="e.g. Honda, Ford"
                  value={make}
                  onChange={e => setMake(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Model (Optional)</label>
                <input
                  id="vehicle-model-input"
                  type="text"
                  placeholder="e.g. Civic Sport, F-150"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Year</label>
                <input
                  id="vehicle-year-input"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">License Plate</label>
                <input
                  id="vehicle-plate-input"
                  type="text"
                  placeholder="e.g. 7XYZ89"
                  value={licensePlate}
                  onChange={e => setLicensePlate(e.target.value)}
                  autoCapitalize="characters"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                  Starting Odometer ({preferences.distanceUnit}) *
                </label>
                <input
                  id="vehicle-odometer-input"
                  type="number"
                  placeholder="e.g. 45000"
                  value={currentOdometer}
                  onChange={e => setCurrentOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">
                  Tag Colors
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {VEHICLE_COLORS.map(c => (
                    <button
                      id={`color-picker-${c.replace('#','')}`}
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full border-2 transition flex items-center justify-center shrink-0 cursor-pointer"
                      style={{ 
                        backgroundColor: c, 
                        borderColor: color === c ? 'white' : 'transparent',
                        boxShadow: color === c ? '0 0 0 2px #6366f1' : 'none'
                      }}
                    >
                      {color === c && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}

                  {/* Custom color picker */}
                  <div 
                    className="relative w-8 h-8 rounded-full border-2 transition flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
                    style={{
                      borderColor: !VEHICLE_COLORS.includes(color) ? 'white' : 'transparent',
                      boxShadow: !VEHICLE_COLORS.includes(color) ? '0 0 0 2px #6366f1' : 'none',
                      backgroundColor: !VEHICLE_COLORS.includes(color) ? color : '#f1f5f9'
                    }}
                    title="Choose custom color"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="custom-color-picker-input"
                    />
                    {!VEHICLE_COLORS.includes(color) ? (
                      <Check className="h-4 w-4 text-white mix-blend-difference" />
                    ) : (
                      <Pipette className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Notes</label>
                <textarea
                  id="vehicle-notes-input"
                  placeholder="Additional profile information (fuel specs, tire sizes, oils)"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <button
              id="submit-vehicle-btn"
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition mt-2 cursor-pointer shadow-sm"
            >
              Verify & Add Vehicle
            </button>
          </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vehicles Fleet List */}
      <div className="space-y-4">
        {vehicles.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-250 bg-white rounded-3xl space-y-3 p-6 shadow-sm">
            <Car className="h-10 w-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-slate-800 font-bold text-sm">Your Garage is Empty</p>
              <p className="text-slate-550 text-xs">Register your first vehicle below to begin logging information!</p>
            </div>
            <button
              id="empty-state-add-vehicle-btn"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition cursor-pointer"
            >
              Configure Car Profile
            </button>
          </div>
        ) : (
          vehicles.map(v => {
            const stats = getVehicleStats(v.id);
            const colorScheme = getVehiclesColorMap(v.color);

            return (
              <div 
                key={v.id} 
                onClick={() => setSelectedDetailVehicleId(v.id)}
                className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 hover:border-slate-350 hover:shadow-md transition duration-200 relative overflow-hidden cursor-pointer"
                id={`vehicle-card-${v.id}`}
              >
                {/* Visual Accent Corner Color */}
                <div 
                  className="absolute right-0 top-0 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
                  style={{ backgroundColor: v.color }}
                />

                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`p-3 rounded-2xl shrink-0 ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`} style={colorScheme.style}>
                      {getVehicleIcon(v.vehicleType)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
                        {v.name}
                        {v.licensePlate && (
                          <span className="text-[10px] text-slate-650 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            {v.licensePlate}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'Standard Profile'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id={`edit-vehicle-${v.id}-btn`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(v);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-100 transition cursor-pointer"
                      title="Edit Vehicle Details"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      id={`delete-vehicle-${v.id}-btn`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(v.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-100 transition cursor-pointer"
                      title="Remove Vehicle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {v.notes && (
                  <p className="mt-3.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-semibold">
                    {v.notes}
                  </p>
                )}

                {/* Substats dashboard */}
                <div className="grid grid-cols-3 gap-3.5 mt-4.5 pt-4.5 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Odometer</span>
                    <span className="block text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-slate-400" />
                      {v.currentOdometer.toLocaleString()} {preferences.distanceUnit}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Refills</span>
                    <span className="block text-xs font-bold text-slate-900">
                      {stats.refillCount} fill-ups
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest">Total cost</span>
                    <span className="block text-xs font-extrabold text-indigo-600">
                      {formatCurrency(stats.totalSpend, preferences.currency)}
                    </span>
                  </div>
                </div>

                {/* Detailed cost distribution bar */}
                {stats.totalSpend > 0 && (
                  <div className="mt-4.5 space-y-1.5 pt-3 border-t border-slate-50">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                      <span>Fuel ({Math.round((stats.fuelSpend / stats.totalSpend) * 100)}%)</span>
                      <span>Service ({Math.round((stats.maintSpend / stats.totalSpend) * 100)}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(stats.fuelSpend / stats.totalSpend) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${(stats.maintSpend / stats.totalSpend) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              id="delete-confirm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm relative z-50 space-y-4 shadow-2xl"
              id="delete-confirm-modal"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-100 shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Delete Vehicle?</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Irreversible Action</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to delete <strong className="text-slate-900">{vehicles.find(v => v.id === deleteConfirmId)?.name}</strong>? 
                This will permanently delete this profile, as well as all associated fuel refills, maintenance logbooks, and documents.
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  id="cancel-delete-btn"
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-btn"
                  type="button"
                  onClick={() => {
                    if (deleteConfirmId) {
                      onDeleteVehicle(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/15"
                >
                  Delete Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Vehicle Modal */}
      <AnimatePresence>
        {editVehicle && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              id="edit-vehicle-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditVehicle(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-md relative z-50 space-y-4 shadow-2xl my-8"
              id="edit-vehicle-modal"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-950 flex items-center gap-2">
                  <Car className="h-4 w-4 text-indigo-600" /> Edit Vehicle Profile
                </h3>
                <button 
                  id="close-edit-vehicle-btn"
                  onClick={() => setEditVehicle(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-slate-800">
                {editFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs text-center font-bold">
                    {editFormError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Nickname *</label>
                    <input
                      id="edit-vehicle-name-input"
                      type="text"
                      placeholder="e.g. My Civic, Family SUV"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Vehicle Type</label>
                    <select
                      id="edit-vehicle-type-select"
                      value={editVehicleType}
                      onChange={e => setEditVehicleType(e.target.value)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                    >
                      {VEHICLE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Fuel Type</label>
                    <select
                      id="edit-vehicle-fuel-select"
                      value={editFuelType}
                      onChange={e => setEditFuelType(e.target.value)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                    >
                      {FUEL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Make (Optional)</label>
                    <input
                      id="edit-vehicle-make-input"
                      type="text"
                      placeholder="e.g. Honda, Ford"
                      value={editMake}
                      onChange={e => setEditMake(e.target.value)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Model (Optional)</label>
                    <input
                      id="edit-vehicle-model-input"
                      type="text"
                      placeholder="e.g. Civic Sport, F-150"
                      value={editModel}
                      onChange={e => setEditModel(e.target.value)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Year</label>
                    <input
                      id="edit-vehicle-year-input"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={editYear}
                      onChange={e => setEditYear(Number(e.target.value))}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">License Plate</label>
                    <input
                      id="edit-vehicle-plate-input"
                      type="text"
                      placeholder="e.g. 7XYZ89"
                      value={editLicensePlate}
                      onChange={e => setEditLicensePlate(e.target.value)}
                      autoCapitalize="characters"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                      Current Odometer ({preferences.distanceUnit}) *
                    </label>
                    <input
                      id="edit-vehicle-odometer-input"
                      type="number"
                      placeholder="e.g. 45000"
                      value={editCurrentOdometer}
                      onChange={e => setEditCurrentOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">
                      Tag Colors
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {VEHICLE_COLORS.map(c => (
                        <button
                          id={`edit-color-picker-${c.replace('#','')}`}
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className="w-8 h-8 rounded-full border-2 transition flex items-center justify-center shrink-0 cursor-pointer"
                          style={{ 
                            backgroundColor: c, 
                            borderColor: editColor === c ? 'white' : 'transparent',
                            boxShadow: editColor === c ? '0 0 0 2px #6366f1' : 'none'
                          }}
                        >
                          {editColor === c && <Check className="h-4 w-4 text-white" />}
                        </button>
                      ))}

                      {/* Custom color picker */}
                      <div 
                        className="relative w-8 h-8 rounded-full border-2 transition flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
                        style={{
                          borderColor: !VEHICLE_COLORS.includes(editColor) ? 'white' : 'transparent',
                          boxShadow: !VEHICLE_COLORS.includes(editColor) ? '0 0 0 2px #6366f1' : 'none',
                          backgroundColor: !VEHICLE_COLORS.includes(editColor) ? editColor : '#f1f5f9'
                        }}
                        title="Choose custom color"
                      >
                        <input
                          type="color"
                          value={editColor}
                          onChange={e => setEditColor(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="edit-custom-color-picker-input"
                        />
                        {!VEHICLE_COLORS.includes(editColor) ? (
                          <Check className="h-4 w-4 text-white mix-blend-difference" />
                        ) : (
                          <Pipette className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Notes</label>
                    <textarea
                      id="edit-vehicle-notes-input"
                      placeholder="Additional profile information (fuel specs, tire sizes, oils)"
                      rows={2}
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    id="cancel-edit-vehicle-btn"
                    type="button"
                    onClick={() => setEditVehicle(null)}
                    className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-edit-vehicle-btn"
                    type="submit"
                    className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Details / Edit Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              id="activity-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-md relative z-50 space-y-4 shadow-2xl my-8 text-left text-slate-800"
              id="activity-detail-modal"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className={`${isEditingActivity ? 'text-xs' : 'text-sm'} font-extrabold text-slate-950 flex items-center gap-2`}>
                  {selectedActivity.type === 'refill' && <Droplet className="h-4 w-4 text-emerald-600" />}
                  {selectedActivity.type === 'odometer' && <Gauge className="h-4 w-4 text-amber-500" />}
                  {selectedActivity.type === 'maintenance' && <Wrench className="h-4 w-4 text-indigo-600" />}
                  {isEditingActivity ? 'Edit Log Entry' : 'Log Entry Details'}
                </h3>
                <button 
                  id="close-activity-modal-btn"
                  onClick={() => setSelectedActivity(null)}
                  className="p-1 text-slate-450 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {activityFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs text-center font-bold">
                  {activityFormError}
                </div>
              )}

              {/* VIEW MODE */}
              {!isEditingActivity && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-2.5">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Log Type</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                        selectedActivity.type === 'refill' 
                          ? 'text-emerald-650 bg-emerald-50 border border-emerald-100' 
                          : selectedActivity.type === 'odometer'
                          ? 'text-amber-700 bg-amber-50 border border-amber-150'
                          : 'text-indigo-650 bg-indigo-50 border border-indigo-150'
                      }`}>
                        {selectedActivity.type === 'refill' && 'Fuel Refill'}
                        {selectedActivity.type === 'odometer' && 'Odometer Reading'}
                        {selectedActivity.type === 'maintenance' && 'Completed Service'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date</span>
                      <span className="text-slate-900 font-extrabold">{formatDate(actDate)}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Odometer</span>
                      <span className="text-slate-900 font-extrabold">{Number(actOdometer).toLocaleString()} {preferences.distanceUnit}</span>
                    </div>

                    {selectedActivity.type === 'refill' && (
                      <>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Fuel Volume</span>
                          <span className="text-slate-900 font-extrabold">{actVolume} {preferences.volumeUnit}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Price per {preferences.volumeUnit}</span>
                          <span className="text-slate-900 font-extrabold">{formatCurrency(Number(actPricePerUnit), preferences.currency)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Cost</span>
                          <span className="text-slate-900 font-extrabold">{formatCurrency(Number(actTotalCost), preferences.currency)}</span>
                        </div>
                        {actGasStation && (
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Gas Station</span>
                            <span className="text-slate-900 font-extrabold">{actGasStation}</span>
                          </div>
                        )}
                        {actFuelBrand && (
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Fuel Brand</span>
                            <span className="text-slate-900 font-extrabold">{actFuelBrand}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tank Status</span>
                          <span className="text-slate-900 font-extrabold">{actFullTank ? 'Filled to Full' : 'Partial Refill'}</span>
                        </div>
                      </>
                    )}

                    {selectedActivity.type === 'maintenance' && (
                      <>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Service / Name</span>
                          <span className="text-indigo-600 font-extrabold">{actServiceType}</span>
                        </div>
                        {actTitle && actTitle !== 'Odometer Reading Updated' && (
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Description</span>
                            <span className="text-slate-900 font-extrabold">{actTitle}</span>
                          </div>
                        )}
                        {Number(actCost) > 0 && (
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cost</span>
                            <span className="text-slate-900 font-extrabold">{formatCurrency(Number(actCost), preferences.currency)}</span>
                          </div>
                        )}
                        {actProvider && (
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Provider</span>
                            <span className="text-slate-900 font-extrabold">{actProvider}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            actStatus === 'Completed' ? 'bg-emerald-50 text-emerald-650' : 'bg-amber-50 text-amber-650'
                          }`}>{actStatus}</span>
                        </div>
                      </>
                    )}

                    {actNotes && (
                      <div className="space-y-1 pt-1.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Notes</span>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-slate-700 leading-relaxed text-xs">
                          {actNotes}
                        </div>
                      </div>
                    )}

                    {actReceiptPhoto && (
                      <div className="flex justify-between border-b border-slate-100 pb-2 items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Receipt Photo</span>
                        <button
                          type="button"
                          onClick={() => setSelectedActivityPhoto(actReceiptPhoto)}
                          className="flex items-center gap-1.5 p-1 px-2 hover:bg-slate-50 rounded-lg transition border border-slate-200 cursor-pointer"
                          title="View Receipt Photo"
                        >
                          <img src={actReceiptPhoto} alt="Receipt Thumb" className="h-8 w-8 object-cover rounded-md border border-slate-200 shrink-0" />
                          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">View Full</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button
                      id="close-act-detail-btn"
                      type="button"
                      onClick={() => setSelectedActivity(null)}
                      className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      id="edit-act-detail-btn"
                      type="button"
                      onClick={() => setIsEditingActivity(true)}
                      className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Details
                    </button>
                  </div>
                </div>
              )}

              {/* EDIT FORM MODE */}
              {isEditingActivity && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-slate-800 text-xs">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Date *</label>
                      <input
                        id="act-date-input"
                        type="date"
                        value={actDate}
                        onChange={e => setActDate(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                        Odometer Reading ({preferences.distanceUnit}) *
                      </label>
                      <input
                        id="act-odometer-input"
                        type="number"
                        value={actOdometer}
                        onChange={e => setActOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    {/* Fuel Refill Fields */}
                    {selectedActivity.type === 'refill' && (
                      <>
                        <div className="col-span-2 flex items-center gap-2 py-1">
                          <input
                            id="act-fulltank-checkbox"
                            type="checkbox"
                            checked={actFullTank}
                            onChange={e => setActFullTank(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-200 focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="act-fulltank-checkbox" className="text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                            Filled to Full Tank
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Volume ({preferences.volumeUnit}) *</label>
                          <input
                            id="act-volume-input"
                            type="number"
                            step="any"
                            value={actVolume}
                            onChange={e => setActVolume(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Price per {preferences.volumeUnit} *</label>
                          <input
                            id="act-price-input"
                            type="number"
                            step="any"
                            value={actPricePerUnit}
                            onChange={e => setActPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Total Cost</label>
                          <input
                            id="act-cost-input"
                            type="number"
                            step="any"
                            placeholder="Optional"
                            value={actTotalCost}
                            onChange={e => setActTotalCost(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Gas Station</label>
                          <input
                            id="act-station-input"
                            type="text"
                            value={actGasStation}
                            onChange={e => setActGasStation(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Fuel Brand</label>
                          <input
                            id="act-brand-input"
                            type="text"
                            value={actFuelBrand}
                            onChange={e => setActFuelBrand(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                      </>
                    )}

                    {/* Maintenance Fields */}
                    {selectedActivity.type === 'maintenance' && (
                      <>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Service Name *</label>
                          <input
                            id="act-servicetype-input"
                            type="text"
                            value={actServiceType}
                            onChange={e => setActServiceType(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Description (Optional)</label>
                          <input
                            id="act-title-input"
                            type="text"
                            placeholder="e.g. 10,000 mi maintenance check"
                            value={actTitle}
                            onChange={e => setActTitle(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Cost</label>
                          <input
                            id="act-maintcost-input"
                            type="number"
                            value={actCost}
                            onChange={e => setActCost(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Provider</label>
                          <input
                            id="act-provider-input"
                            type="text"
                            value={actProvider}
                            onChange={e => setActProvider(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Status</label>
                          <select
                            id="act-status-select"
                            value={actStatus}
                            onChange={e => setActStatus(e.target.value as any)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                          >
                            <option value="Completed">Completed</option>
                            <option value="Scheduled">Scheduled</option>
                          </select>
                        </div>
                      </>
                    )}

                    {(selectedActivity.type === 'refill' || (selectedActivity.type === 'maintenance' && actStatus === 'Completed')) && !selectedActivity.receiptPhoto && (
                      <div className="space-y-1 col-span-2">
                        <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Receipt Photo (Optional)</label>
                        <div className="flex items-center gap-2.5">
                          <input
                            id="act-receipt-photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleActivityPhotoChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="act-receipt-photo-upload"
                            className="h-11 px-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-1.5 text-slate-700 text-xs font-bold transition cursor-pointer select-none"
                          >
                            <Camera className="h-4 w-4 text-indigo-650" />
                            Choose Photo
                          </label>
                          {actReceiptPhoto ? (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-1.5 pl-2.5 pr-3">
                              <img src={actReceiptPhoto} alt="Receipt Preview" className="h-8 w-8 object-cover rounded-lg border border-slate-200" />
                              <span className="text-[10px] text-emerald-700 font-extrabold">Photo Ready</span>
                              <button
                                type="button"
                                onClick={() => setActReceiptPhoto('')}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition cursor-pointer"
                                title="Remove Photo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold">No photo selected</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Notes</label>
                      <textarea
                        id="act-notes-input"
                        placeholder="Additional details..."
                        rows={2.5}
                        value={actNotes}
                        onChange={e => setActNotes(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      id="cancel-act-edit-btn"
                      type="button"
                      onClick={() => setIsEditingActivity(false)}
                      className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      id="save-act-edit-btn"
                      type="button"
                      onClick={handleSaveActivityEdit}
                      className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/15"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {renderDeleteActivityModal()}
      {renderPhotoViewerModal()}
    </>
  );
}
