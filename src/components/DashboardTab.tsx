import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, Plus, Droplet, Wrench, Bell, AlertTriangle, 
  Coins, TrendingUp, Gauge, ChevronRight, CheckCircle2, CalendarClock, FileText
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
}

export default function DashboardTab({
  vehicles,
  refills,
  maintenanceLogs,
  reminders,
  preferences,
  selectedVehicleId,
  setSelectedVehicleId,
  onNavigateToTab
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

  // 2. Spending - Current Month (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRefillsCost = currentVehicleRefills
    .filter(r => new Date(r.date) >= thirtyDaysAgo)
    .reduce((sum, r) => sum + r.totalCost, 0);

  const recentMaintenanceCost = currentVehicleMaintenance
    .filter(m => m.status === 'Completed' && new Date(m.date) >= thirtyDaysAgo)
    .reduce((sum, m) => sum + m.cost, 0);

  const totalRecentSpend = recentRefillsCost + recentMaintenanceCost;

  // 3. Odometer
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentOdometerDisplay = selectedVehicle
    ? `${selectedVehicle.currentOdometer.toLocaleString()} ${preferences.distanceUnit}`
    : vehicles.length > 0 
      ? 'Select vehicle'
      : 'No vehicles yet';

  // 4. Alerts & Reminders check
  const activeRemindersCount = currentVehicleReminders.filter(r => !r.completed).length;
  
  // Find urgent reminders (due in less than 30 days or overdue)
  const today = new Date();
  const alertThreshold = new Date();
  alertThreshold.setDate(today.getDate() + 30);

  const urgentReminders = currentVehicleReminders.filter(rem => {
    if (rem.completed) return false;
    const dueDate = new Date(rem.dueDate);
    return dueDate <= alertThreshold;
  });

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
      };
    })
  ].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    if (a.type === 'odometer' && b.type !== 'odometer') return -1;
    if (b.type === 'odometer' && a.type !== 'odometer') return 1;
    return b.id.localeCompare(a.id);
  })
   .slice(0, 3); // Get top 3 only for home screen

  return (
    <div className="space-y-6 pb-24" id="dashboard-tab-container">
      {/* 1. Header with custom greetings */}
      <div className="flex justify-between items-center px-1 pt-1">
        <div>
          <h2 className="text-xl font-sans tracking-tight font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-xs">Fleet management dashboard</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 font-bold text-sm">
          JD
        </div>
      </div>

      {/* 2. Horizontal Vehicle Selector */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase px-1">Your Garage</span>
          <button 
            id="add-vehicle-nav-btn"
            onClick={() => onNavigateToTab('vehicles')} 
            className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-bold underline transition"
          >
            Manage Garage <ChevronRight className="h-3 w-3 inline ml-0.5" />
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-1">
          <button
            id="select-vehicle-all-btn"
            onClick={() => setSelectedVehicleId('all')}
            className={`flex items-center px-4 py-2.5 rounded-2xl border text-sm font-semibold transition shrink-0 duration-200 ${
              selectedVehicleId === 'all'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Car className="h-4 w-4 mr-2" />
            All Vehicles
          </button>
          
          {vehicles.map(v => (
            <button
              id={`select-vehicle-${v.id}-btn`}
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`flex items-center px-4 py-2.5 rounded-2xl border text-sm font-semibold transition shrink-0 duration-200 ${
                selectedVehicleId === v.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full mr-2 block shrink-0" 
                style={{ backgroundColor: v.color }}
              />
              <span className="max-w-[120px] truncate">{v.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Urgent Renewal Notifications banner */}
      <AnimatePresence>
        {indigoRenAlert(urgentReminders, onNavigateToTab)}
      </AnimatePresence>

      {/* 4. Stat Widgets Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Efficiency Card */}
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

        {/* 30-Day Spending Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between hover:border-slate-350 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Coins className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Last 30d</span>
          </div>
          <div className="mt-4 space-y-0.5">
            <h5 className="text-2xl font-black font-sans text-slate-900 tracking-tight">
              {formatCurrency(totalRecentSpend, preferences.currency)}
            </h5>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total logged spend</p>
          </div>
        </div>

        {/* Dynamic Odometer Card */}
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

        {/* Active Deadlines Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col justify-between hover:border-slate-350 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Bell className="h-4 w-4" />
            </div>
            {activeRemindersCount > 0 && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pending
              </span>
            )}
          </div>
          <div className="mt-4 space-y-0.5">
            <h5 className="text-2xl font-black font-sans text-slate-900 tracking-tight">
              {activeRemindersCount}
            </h5>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Reminders due</p>
          </div>
        </div>
      </div>

      {/* 5. Key Timeline Feed (Bento Style) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Recent Operations</span>
          <button 
            id="view-logs-nav-btn"
            onClick={() => onNavigateToTab('maintenance')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline transition flex items-center"
          >
            History Feed <ChevronRight className="h-3.5 w-3.5 ml-0.5 animate-pulse" />
          </button>
        </div>

        {combinedTimelineItems.length === 0 ? (
          <div className="text-center py-8 space-y-2 border border-dashed border-slate-200 rounded-2xl">
            <CalendarClock className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-xs font-semibold">No operations logged recently.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {combinedTimelineItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-center group pb-1.5 last:pb-0 border-b border-slate-50 last:border-0">
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
                    <h6 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">{item.title}</h6>
                    <p className="text-[10px] text-slate-400 font-medium">{item.subtitle} • {formatDate(item.date)}</p>
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
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function indigoRenAlert(urgentReminders: RenewalReminder[], onNavigateToTab: (tabId: string) => void) {
  if (urgentReminders.length === 0) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-amber-200 rounded-3xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden"
      id="urgent-alert-banner"
    >
      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0 border border-amber-100">
        <FileText className="h-5 w-5 animate-pulse" />
      </div>
      
      <div className="space-y-1 flex-1 text-slate-850">
        <h4 className="text-sm font-bold text-slate-900">Document Expiration Alert</h4>
        <p className="text-slate-600 text-xs leading-relaxed font-medium">
          You have <strong className="text-amber-700">{urgentReminders.length}</strong> upcoming document expiration{urgentReminders.length > 1 ? 's' : ''}! Please review registration & insurance details.
        </p>
        <button 
          id="view-reminders-action-btn"
          onClick={() => onNavigateToTab('reminders')}
          className="text-xs text-indigo-650 font-bold hover:underline mt-1.5 inline-flex items-center gap-1 transition"
        >
          View Documents Now <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
