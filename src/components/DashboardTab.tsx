import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, Plus, Droplet, Wrench, AlertTriangle, 
  TrendingUp, Gauge, ChevronRight, CheckCircle2, CalendarClock, FileText
} from 'lucide-react';
import { Vehicle, FuelRefill, MaintenanceLog, RenewalReminder, UserPreferences } from '../types';
import { formatCurrency, formatEfficiency, formatDate } from '../utils';

interface DashboardTabProps {
  vehicles: Vehicle[];
  refills: FuelRefill[];
  maintenanceLogs: MaintenanceLog[];
  reminders: RenewalReminder[];
  preferences: UserPreferences;
  selectedVehicleId: string | 'all';
  setSelectedVehicleId: (id: string | 'all') => void;
  onNavigateToTab: (tabId: string) => void;
  onSelectRecentOperation?: (id: string, type: 'refill' | 'maintenance' | 'odometer', vehicleId: string) => void;
}

export default function DashboardTab({
  vehicles,
  refills,
  maintenanceLogs,
  reminders,
  preferences,
  selectedVehicleId,
  setSelectedVehicleId,
  onNavigateToTab,
  onSelectRecentOperation
}: DashboardTabProps) {
  // Filter entities according to selected vehicle
  const currentVehicleRefills = selectedVehicleId === 'all' 
    ? refills 
    : refills.filter(r => r.vehicleId === selectedVehicleId);

  const currentVehicleMaintenance = selectedVehicleId === 'all'
    ? maintenanceLogs
    : maintenanceLogs.filter(m => m.vehicleId === selectedVehicleId);

  const currentVehicleReminders = selectedVehicleId === 'all'
    ? reminders
    : reminders.filter(r => r.vehicleId === selectedVehicleId || r.vehicleId === 'all');

  // Statistics calculation
  // 1. Average Efficiency
  const validEfficiencies = currentVehicleRefills
    .map(r => r.efficiency)
    .filter((e): e is number => e !== undefined && e > 0);
  
  const avgEfficiency = validEfficiencies.length > 0
    ? validEfficiencies.reduce((sum, val) => sum + val, 0) / validEfficiencies.length
    : null;

  // 2. Odometer
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentOdometerDisplay = selectedVehicle
    ? `${selectedVehicle.currentOdometer.toLocaleString()} ${preferences.distanceUnit}`
    : vehicles.length > 0 
      ? 'Select vehicle'
      : 'No vehicles yet';
  
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const expiredReminders = currentVehicleReminders.filter(rem => {
    if (rem.completed) return false;
    const dueDate = new Date(rem.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < todayMidnight;
  });

  const upcomingReminders = currentVehicleReminders.filter(rem => {
    if (rem.completed) return false;
    const dueDate = new Date(rem.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate >= todayMidnight) {
      const warningThreshold = new Date(todayMidnight);
      warningThreshold.setDate(todayMidnight.getDate() + rem.alertDaysBefore);
      return dueDate <= warningThreshold;
    }
    return false;
  });

  const expiredCount = expiredReminders.length;
  const upcomingCount = upcomingReminders.length;

  // Recent combined timeline items
  const combinedTimelineItems = [
    ...currentVehicleRefills.map(r => ({
      id: r.id,
      type: 'refill' as const,
      date: r.date,
      title: 'Fuel Refill',
      subtitle: `${r.volume} ${preferences.volumeUnit} Refilled`,
      amount: r.totalCost,
      status: 'Completed',
      vehicleId: r.vehicleId,
    })),
    ...currentVehicleMaintenance.map(m => {
      const isOdometerUpdate = m.serviceType === 'Odometer Update';
      return {
        id: m.id,
        type: isOdometerUpdate ? ('odometer' as const) : ('maintenance' as const),
        date: m.date,
        title: isOdometerUpdate ? 'Odometer Reading' : m.serviceType,
        subtitle: isOdometerUpdate
          ? `${m.odometer.toLocaleString()} ${preferences.distanceUnit}`
          : (m.title === 'Odometer Reading Updated' ? '' : m.title),
        amount: m.cost,
        status: m.status,
        vehicleId: m.vehicleId,
      };
    })
  ].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    if (a.type === 'odometer' && b.type !== 'odometer') return -1;
    if (b.type === 'odometer' && a.type !== 'odometer') return 1;
    return b.id.localeCompare(a.id);
  })
   .slice(0, 5); // Limit recent operation to latest 5 activities

  return (
    <div className="space-y-6 pb-24" id="dashboard-tab-container">
      {/* Horizontal Vehicle Selector */}
      <div className="space-y-2">
        <div className="relative px-1">
          <select
            id="vehicle-select-dropdown"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full h-11 pl-11 pr-10 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition shadow-sm"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} {v.licensePlate ? `(${v.licensePlate})` : ''}
              </option>
            ))}
          </select>
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            {selectedVehicleId === 'all' ? (
              <Car className="h-4 w-4 text-indigo-600" />
            ) : (
              <span 
                className="w-3 h-3 rounded-full block border border-slate-100 shadow-sm" 
                style={{ backgroundColor: vehicles.find(v => v.id === selectedVehicleId)?.color || '#6366f1' }}
              />
            )}
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Urgent Renewal Notifications banner */}
      <AnimatePresence>
        {indigoRenAlert(expiredCount, upcomingCount, onNavigateToTab)}
      </AnimatePresence>

      {/* 4. Stat Widgets Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Dynamic Odometer Card (Gauge) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between hover:border-slate-350 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
              <Gauge className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Gauge</span>
          </div>
          <div className="mt-4 space-y-0.5">
            <h5 className="text-lg font-black font-sans text-slate-900 tracking-tight truncate">
              {currentOdometerDisplay}
            </h5>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Odometer status</p>
          </div>
        </div>

        {/* Efficiency Card (Avg Fuel) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between hover:border-slate-350 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Avg Fuel</span>
          </div>
          <div className="mt-4 space-y-0.5">
            <h5 className="text-2xl font-black font-sans text-slate-900 tracking-tight">
              {avgEfficiency ? avgEfficiency.toFixed(1) : '--'}
            </h5>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {avgEfficiency ? preferences.efficiencyUnit : 'Need refills'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Key Timeline Feed (Bento Style) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Recent Operations</span>
        </div>

        {combinedTimelineItems.length === 0 ? (
          <div className="text-center py-8 space-y-2 border border-dashed border-slate-200 rounded-2xl">
            <CalendarClock className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-xs font-semibold">No operations logged recently.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {combinedTimelineItems.map((item, index) => {
              const v = vehicles.find(veh => veh.id === item.vehicleId);
              return (
                <div 
                  key={`${item.id}-${index}`} 
                  onClick={() => onSelectRecentOperation?.(item.id, item.type, item.vehicleId)}
                  className="flex justify-between items-center group pb-2 last:pb-0 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50/50 p-2 -mx-2 rounded-2xl transition duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      item.type === 'refill' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : item.type === 'odometer'
                          ? 'bg-amber-50 text-amber-500 border border-amber-100'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      {item.type === 'refill' ? (
                        <Droplet className="h-4 w-4" />
                      ) : item.type === 'odometer' ? (
                        <Gauge className="h-4 w-4" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      {selectedVehicleId === 'all' && v && (
                        <span className="block text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-1.5 py-0.5 rounded max-w-max mb-1 tracking-wider">
                          {v.name} {v.licensePlate ? `(${v.licensePlate})` : ''}
                        </span>
                      )}
                      <h6 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">{item.title}</h6>
                      <p className="text-[10px] text-slate-450 font-medium">{item.subtitle} • {formatDate(item.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.amount > 0 && (
                      <span className="text-xs font-black text-slate-900">{formatCurrency(item.amount, preferences.currency)}</span>
                    )}
                    {item.status === 'Scheduled' && (
                      <span className="block text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded uppercase mt-0.5 max-w-max ml-auto">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function indigoRenAlert(expiredCount: number, upcomingCount: number, onNavigateToTab: (tabId: string) => void) {
  let borderClass = 'border-transparent';
  let iconClass = 'bg-slate-50 text-slate-400 border border-slate-100';
  let iconAnimationClass = '';
  let messageContent: React.ReactNode = null;

  if (expiredCount === 0 && upcomingCount === 0) {
    borderClass = 'border-transparent bg-slate-50/40';
    iconClass = 'bg-slate-100 text-slate-400 border border-slate-200';
    messageContent = (
      <>
        You have 0 expired document/s and 0 upcoming document expiration/s!
      </>
    );
  } else if (expiredCount > 0) {
    // Red border if there is an expired document (and optionally upcoming)
    borderClass = 'border-red-200 bg-white';
    iconClass = 'bg-red-50 text-red-600 border border-red-100';
    iconAnimationClass = 'animate-pulse';
    if (upcomingCount === 0) {
      messageContent = (
        <>
          You have <strong className="text-red-700">{expiredCount}</strong> {expiredCount > 1 ? 'expired documents' : 'expired document'}!
        </>
      );
    } else {
      messageContent = (
        <>
          You have <strong className="text-red-700">{expiredCount}</strong> {expiredCount > 1 ? 'expired documents' : 'expired document'} and <strong className="text-red-700">{upcomingCount}</strong> {upcomingCount > 1 ? 'upcoming document expirations' : 'upcoming document expiration'}!
        </>
      );
    }
  } else {
    // Orange border if upcoming only (expiredCount is 0, upcomingCount > 0)
    borderClass = 'border-orange-200 bg-white';
    iconClass = 'bg-orange-50 text-orange-600 border border-orange-100';
    iconAnimationClass = 'animate-pulse';
    messageContent = (
      <>
        You have <strong className="text-orange-700">{upcomingCount}</strong> {upcomingCount > 1 ? 'upcoming document expirations' : 'upcoming document expiration'}!
      </>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border ${borderClass} rounded-2xl p-4 flex items-center gap-3.5 shadow-sm relative overflow-hidden`}
      id="urgent-alert-banner"
    >
      <div className={`p-2 rounded-xl shrink-0 ${iconClass}`}>
        <FileText className={`h-4.5 w-4.5 ${iconAnimationClass}`} />
      </div>
      
      <div className="flex-1 min-w-0 text-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-900">Document Expiration Alert</h4>
          <p className="text-slate-600 text-[11px] leading-snug font-medium">
            {messageContent}
          </p>
        </div>
        <button 
          id="view-reminders-action-btn"
          onClick={() => onNavigateToTab('reminders')}
          className="text-xs text-indigo-650 hover:text-indigo-800 font-bold hover:underline shrink-0 flex items-center gap-0.5 transition cursor-pointer self-start md:self-center mt-1 md:mt-0"
        >
          <span>View Documents</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
