import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, Plus, CheckCircle2, AlertTriangle, Calendar, 
  Gauge, User, X, AlertCircle, ChevronDown, Check, Trash2 
} from 'lucide-react';
import { MaintenanceLog, Vehicle, UserPreferences } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface MaintenanceTabProps {
  logs: MaintenanceLog[];
  vehicles: Vehicle[];
  preferences: UserPreferences;
  selectedVehicleId: string | 'all';
  onAddLog: (log: Omit<MaintenanceLog, 'id'>) => void;
  onUpdateStatus: (id: string, updates: Partial<MaintenanceLog>) => void;
  onDeleteLog: (id: string) => void;
  showAddFormImmediately?: boolean;
  onCloseImmediateForm?: () => void;
  hideList?: boolean;
}

const SERVICE_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Service',
  'Engine Air Filter',
  'Cabin Air Filter',
  'Battery Replacement',
  'Vehicle Inspection',
  'Spark Plugs',
  'Other'
];

export default function MaintenanceTab({
  logs,
  vehicles,
  preferences,
  selectedVehicleId,
  onAddLog,
  onUpdateStatus,
  onDeleteLog,
  showAddFormImmediately = false,
  onCloseImmediateForm,
  hideList = false
}: MaintenanceTabProps) {
  const [showAddForm, setShowAddForm] = useState(showAddFormImmediately);
  const [vehicleId, setVehicleId] = useState(
    selectedVehicleId !== 'all' ? selectedVehicleId : vehicles[0]?.id || ''
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState('');
  const [title, setTitle] = useState('');
  const [odometer, setOdometer] = useState<number | ''>('');
  const [cost, setCost] = useState<string>('');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Completed' | 'Scheduled'>('Completed');
  
  // Recurrence & Scheduling Basis
  const [scheduleType, setScheduleType] = useState<'Calendar-and-Mileage' | 'Calendar-Only' | 'Mileage-Only'>('Calendar-and-Mileage');
  const [hasRecurrence, setHasRecurrence] = useState(true);
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextDueOdometer, setNextDueOdometer] = useState<number | ''>('');

  // Mark Completed Mini-modal
  const [compLogId, setCompLogId] = useState<string | null>(null);
  const [compCost, setCompCost] = useState<string>('');
  const [compOdometer, setCompOdometer] = useState<number | ''>('');

  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync Quick Actions
  useEffect(() => {
    if (showAddFormImmediately) {
      setShowAddForm(true);
      if (selectedVehicleId !== 'all') {
        setVehicleId(selectedVehicleId);
      } else if (vehicles.length > 0) {
        setVehicleId(vehicles[0].id);
      }
    }
  }, [showAddFormImmediately, selectedVehicleId, vehicles]);

  const filteredLogs = selectedVehicleId === 'all'
    ? logs
    : logs.filter(l => l.vehicleId === selectedVehicleId);

  // Divide into Scheduled and History
  const scheduledServices = filteredLogs
    .filter(l => l.status === 'Scheduled')
    .sort((a, b) => new Date(a.date || '9999-12-31').getTime() - new Date(b.date || '9999-12-31').getTime());

  const completedServices = filteredLogs
    .filter(l => l.status === 'Completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return setFormError('Please select a vehicle');
    if (!serviceType.trim()) return setFormError('Service is required');

    if (status === 'Completed') {
      if (!date) return setFormError('Service Date is required');
      if (odometer === '' || odometer < 0) return setFormError('Odometer Reading is required');

      if (hasRecurrence) {
        if (scheduleType === 'Calendar-and-Mileage') {
          if (!nextDueDate) return setFormError('Next service date is required');
          if (nextDueOdometer === '' || nextDueOdometer < 0) return setFormError('Next odometer reading is required');
        } else if (scheduleType === 'Calendar-Only') {
          if (!nextDueDate) return setFormError('Next service date is required');
        } else if (scheduleType === 'Mileage-Only') {
          if (nextDueOdometer === '' || nextDueOdometer < 0) return setFormError('Next odometer reading is required');
        }
      }
    } else {
      // status === 'Scheduled' (Plan / Schedule)
      if (scheduleType === 'Calendar-and-Mileage') {
        if (!date) return setFormError('Scheduled Date is required');
        if (odometer === '' || odometer < 0) return setFormError('Target odometer reading is required');
      } else if (scheduleType === 'Calendar-Only') {
        if (!date) return setFormError('Scheduled Date is required');
      } else if (scheduleType === 'Mileage-Only') {
        if (odometer === '' || odometer < 0) return setFormError('Target odometer reading is required');
      }
    }

    const finalTitle = title.trim() || serviceType.trim();
    const finalCost = cost === '' ? 0 : Number(cost);

    onAddLog({
      vehicleId,
      date: (status === 'Scheduled' && scheduleType === 'Mileage-Only') ? '' : date,
      serviceType: serviceType.trim(),
      title: finalTitle,
      odometer: (status === 'Scheduled' && scheduleType === 'Calendar-Only') ? 0 : Number(odometer),
      cost: finalCost,
      provider: provider.trim() || 'Self / General',
      notes: notes.trim() || undefined,
      status,
      nextDueDate: (status === 'Completed' && hasRecurrence && scheduleType !== 'Mileage-Only') ? nextDueDate : undefined,
      nextDueOdometer: (status === 'Completed' && hasRecurrence && scheduleType !== 'Calendar-Only' && nextDueOdometer !== '') ? Number(nextDueOdometer) : undefined
    });

    // Reset
    setServiceType('');
    setTitle('');
    setOdometer('');
    setCost('');
    setProvider('');
    setNotes('');
    setStatus('Completed');
    setHasRecurrence(true);
    setScheduleType('Calendar-and-Mileage');
    setNextDueDate('');
    setNextDueOdometer('');
    setFormError('');
    setShowAddForm(false);
    if (onCloseImmediateForm) onCloseImmediateForm();
  };

  const handleMarkCompletedSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compLogId) return;
    if (compOdometer === '' || compOdometer < 0) return;

    onUpdateStatus(compLogId, {
      status: 'Completed',
      odometer: Number(compOdometer),
      cost: compCost === '' ? 0 : Number(compCost),
      date: new Date().toISOString().split('T')[0] // Set completion date to today
    });

    setCompLogId(null);
    setCompOdometer('');
    setCompCost('');
  };

  return (
    <div className="space-y-6 pb-24" id="maintenance-tab-container">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-sans tracking-tight font-bold text-slate-900">Maintenance</h2>
        </div>
        {!showAddForm && vehicles.length > 0 && (
          <button
            id="toggle-add-maint-btn"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/10 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Log Service
          </button>
        )}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-8 p-6 bg-white border border-slate-200 rounded-3xl text-sm text-slate-500 shadow-sm font-semibold">
          Please add a vehicle in the <strong className="text-indigo-600">Garage</strong> first to track maintenance schedule.
        </div>
      )}

      {/* Add Maintenance record form */}
      <AnimatePresence>
        {showAddForm && vehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4 overflow-hidden"
            id="maintenance-add-form"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-indigo-600" /> Log Maintenance
              </h3>
              <button
                id="cancel-add-maint-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                  if (onCloseImmediateForm) onCloseImmediateForm();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-55 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs text-center font-bold flex items-center gap-2 justify-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                {/* Vehicle Selection */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vehicle</label>
                  <select
                    id="maint-vehicle-selector"
                    value={vehicleId}
                    onChange={e => setVehicleId(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.year} {v.make} {v.model}) - {v.licensePlate}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Toggle (Aesthetic buttons) */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="opt-maint-completed-btn"
                      type="button"
                      onClick={() => setStatus('Completed')}
                      className={`h-10 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        status === 'Completed'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" /> Completed Log
                    </button>
                    <button
                      id="opt-maint-scheduled-btn"
                      type="button"
                      onClick={() => setStatus('Scheduled')}
                      className={`h-10 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        status === 'Scheduled'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" /> Plan / Schedule
                    </button>
                  </div>
                </div>

                {/* Service Input */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service</label>
                  <input
                    id="maint-service-type-input"
                    type="text"
                    placeholder="e.g. Oil Change, Tire Rotation, Brakes"
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Service Notes */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service Notes</label>
                  <input
                    id="maint-title-input"
                    type="text"
                    placeholder="Parts replaced, consumables used, specifications, etc. (Optional)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* If completed, show Date Performed and Odometer Reading (both required) */}
                {status === 'Completed' && (
                  <>
                    {/* Date */}
                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Date Performed *
                      </label>
                      <input
                        id="maint-date-input"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold min-w-0"
                      />
                    </div>

                    {/* Odometer */}
                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Odometer Reading * ({preferences.distanceUnit})
                      </label>
                      <input
                        id="maint-odometer-input"
                        type="number"
                        placeholder="e.g. 52450"
                        value={odometer}
                        onChange={e => setOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </>
                )}

                {/* If scheduled, show Basis selector and fields */}
                {status === 'Scheduled' && (
                  <div className="col-span-2 grid grid-cols-2 gap-3.5">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reminder Basis *</label>
                      <select
                        id="maint-schedule-type-selector-scheduled"
                        value={scheduleType}
                        onChange={e => setScheduleType(e.target.value as any)}
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="Calendar-and-Mileage">Calendar-Based / Mileage-based</option>
                        <option value="Calendar-Only">Calendar-Based Only</option>
                        <option value="Mileage-Only">Mileage-based Only</option>
                      </select>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <label className={`text-[10px] uppercase font-bold tracking-wider ${scheduleType === 'Mileage-Only' ? 'text-slate-300' : 'text-slate-400'}`}>
                        Scheduled Date {scheduleType !== 'Mileage-Only' && '*'}
                      </label>
                      <input
                        id="maint-date-input"
                        type="date"
                        disabled={scheduleType === 'Mileage-Only'}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className={`w-full h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold min-w-0 ${
                          scheduleType === 'Mileage-Only' ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200' : ''
                        }`}
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <label className={`text-[10px] uppercase font-bold tracking-wider ${scheduleType === 'Calendar-Only' ? 'text-slate-300' : 'text-slate-400'}`}>
                        Target Odometer {scheduleType !== 'Calendar-Only' && '*'} ({preferences.distanceUnit})
                      </label>
                      <input
                        id="maint-odometer-input"
                        type="number"
                        placeholder="e.g. 52450"
                        disabled={scheduleType === 'Calendar-Only'}
                        value={odometer}
                        onChange={e => setOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                        className={`w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold min-w-0 ${
                          scheduleType === 'Calendar-Only' ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200' : ''
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Cost */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {status === 'Completed' ? `Total Cost (${preferences.currency || 'USD'})` : `Estimated Cost (${preferences.currency || 'USD'})`}
                  </label>
                  <input
                    id="maint-cost-input"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 89.99 (Optional)"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    onBlur={() => {
                      if (cost !== '') {
                        setCost(Number(cost).toFixed(2));
                      }
                    }}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Shop */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-semibold">Shop</label>
                  <input
                    id="maint-provider-input"
                    type="text"
                    placeholder="e.g. Honda Dealership, Self"
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Recurrence (Only if completed) */}
                {status === 'Completed' && (
                  <div className="col-span-2 border-t border-slate-100 pt-3 mt-1 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold select-none">
                      <input
                        id="maint-recurrence-checkbox"
                        type="checkbox"
                        checked={hasRecurrence}
                        onChange={e => setHasRecurrence(e.target.checked)}
                        className="w-5 h-5 border border-slate-250 rounded accent-indigo-600 shrink-0"
                      />
                      <span className="text-xs">Set next reminder date & mileage (Recurrent)</span>
                    </label>

                    {hasRecurrence && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-semibold">Reminder Basis *</label>
                          <select
                            id="maint-schedule-type-selector-completed"
                            value={scheduleType}
                            onChange={e => setScheduleType(e.target.value as any)}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                          >
                            <option value="Calendar-and-Mileage">Calendar-Based / Mileage-based</option>
                            <option value="Calendar-Only">Calendar-Based Only</option>
                            <option value="Mileage-Only">Mileage-based Only</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-1">
                          <div className="space-y-1 min-w-0">
                            <label className={`text-[9px] uppercase font-black ${scheduleType === 'Mileage-Only' ? 'text-slate-300' : 'text-slate-400'}`}>
                              Next Service Date {scheduleType !== 'Mileage-Only' && '*'}
                            </label>
                            <input
                              id="maint-next-due-date-input"
                              type="date"
                              disabled={scheduleType === 'Mileage-Only'}
                              value={nextDueDate}
                              onChange={e => setNextDueDate(e.target.value)}
                              className={`w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none font-semibold min-w-0 ${
                                scheduleType === 'Mileage-Only' ? 'opacity-40 cursor-not-allowed bg-slate-100' : ''
                              }`}
                            />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <label className={`text-[9px] uppercase font-black ${scheduleType === 'Calendar-Only' ? 'text-slate-300' : 'text-slate-400'}`}>
                              Next Odometer {scheduleType !== 'Calendar-Only' && '*'} ({preferences.distanceUnit})
                            </label>
                            <input
                              id="maint-next-due-odo-input"
                              type="number"
                              placeholder="Next mileage"
                              disabled={scheduleType === 'Calendar-Only'}
                              value={nextDueOdometer}
                              onChange={e => setNextDueOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                              className={`w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none font-semibold ${
                                scheduleType === 'Calendar-Only' ? 'opacity-40 cursor-not-allowed bg-slate-100' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service Notes</label>
                  <textarea
                    id="maint-notes-textarea"
                    placeholder="Parts replaced, consumables used, specifications, etc."
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <button
                id="submit-maint-btn"
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition mt-2 cursor-pointer shadow-sm"
              >
                Log Maintenance
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Mark Completed Modal */}
      <AnimatePresence>
        {compLogId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              id="confirm-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setCompLogId(null)}
              className="absolute inset-0 bg-slate-950"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-sm relative z-10 space-y-4 shadow-2xl"
              id="maint-completion-modal"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
                <h4 className="font-bold text-sm text-slate-900">Save Service Receipt</h4>
                <button 
                  id="cancel-completion-modal-btn"
                  onClick={() => setCompLogId(null)} 
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleMarkCompletedSave} className="space-y-4 text-slate-850">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Actual Odometer ({preferences.distanceUnit})</label>
                  <input
                    id="comp-odometer-input"
                    type="number"
                    required
                    placeholder="Enter final mileage"
                    value={compOdometer}
                    onChange={e => setCompOdometer(Number(e.target.value))}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Final Bill / Cost ({preferences.currency || 'USD'})</label>
                  <input
                    id="comp-cost-input"
                    type="number"
                    step="0.01"
                    placeholder="Enter invoice total (Optional)"
                    value={compCost}
                    onChange={e => setCompCost(e.target.value)}
                    onBlur={() => {
                      if (compCost !== '') {
                        setCompCost(Number(compCost).toFixed(2));
                      }
                    }}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <button
                  id="submit-completion-modal-btn"
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white transition text-sm cursor-pointer shadow-sm"
                >
                  Confirm Completion
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Divided sections */}
      {!hideList && (
        <div className="space-y-6">
        
        {/* 1. UPCOMING SCHEDULE */}
        <div className="space-y-3 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-450 flex items-center justify-between text-slate-400">
            <span>Upcoming Schedule ({scheduledServices.length})</span>
            {scheduledServices.length > 0 && <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block animate-pulse" />}
          </h3>

          {scheduledServices.length === 0 ? (
            <div className="text-center py-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-slate-500 text-xs font-semibold">All maintenance schedules are caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledServices.map(item => {
                const vehicleObj = vehicles.find(v => v.id === item.vehicleId);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 flex flex-col justify-between whitespace-normal hover:border-slate-350 transition duration-200"
                    id={`scheduled-item-${item.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl shrink-0 mt-0.5">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          {selectedVehicleId === 'all' && vehicleObj && (
                            <span className="block text-[8px] font-black text-indigo-600 tracking-wider uppercase mb-0.5">
                              {vehicleObj.name}
                            </span>
                          )}
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.title}</h4>
                          <span className="block text-[10px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Due: <strong className="text-slate-800">{formatDate(item.date)}</strong>
                            {item.odometer > 0 && (
                              <>
                                <span className="text-slate-300">•</span>
                                <Gauge className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Target <strong className="text-slate-800">{item.odometer.toLocaleString()} {preferences.distanceUnit}</strong>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* Complete triggers popup */}
                        <button
                          id={`complete-task-${item.id}-btn`}
                          onClick={() => {
                            setCompLogId(item.id);
                            setCompCost(item.cost ? Number(item.cost).toFixed(2) : '');
                            setCompOdometer(item.odometer || '');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-xl transition cursor-pointer"
                        >
                          <Check className="h-3 w-3" /> Done
                        </button>

                        <button
                          id={`delete-scheduled-${item.id}-btn`}
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 px-1.5 text-slate-400 hover:text-rose-650 bg-slate-50 hover:bg-rose-50 border border-slate-100 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-655 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-3.5 leading-relaxed font-semibold">
                        {item.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. COMPLETED SERVICE HISTORY */}
        <div className="space-y-3 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed Service History ({completedServices.length})</h3>

          {completedServices.length === 0 ? (
            <div className="text-center py-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <p className="text-slate-500 text-xs font-semibold">No finished services logged in workshop history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedServices.map(item => {
                const vehicleObj = vehicles.find(v => v.id === item.vehicleId);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 flex flex-col hover:border-slate-350 transition duration-200"
                    id={`completed-item-${item.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="p-2.5 bg-slate-50 text-indigo-600 border border-slate-100 rounded-2xl shrink-0 mt-0.5">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div>
                          {selectedVehicleId === 'all' && vehicleObj && (
                            <span className="block text-[8px] font-black text-slate-400 tracking-wider uppercase mb-0.5">
                              {vehicleObj.name}
                            </span>
                          )}
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                            {formatDate(item.date)} • <span className="font-mono text-slate-650">{item.odometer.toLocaleString()} {preferences.distanceUnit}</span> • <span className="text-slate-600 underline font-sans">{item.provider}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <span className="block text-xs font-extrabold text-slate-900">{formatCurrency(item.cost, preferences.currency)}</span>
                        </div>
                        <button
                          id={`delete-completed-${item.id}-btn`}
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 px-1.5 text-slate-400 hover:text-rose-650 bg-slate-50 hover:bg-rose-50 border border-slate-100 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-655 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-3.5 leading-relaxed font-semibold">
                        {item.notes}
                      </p>
                    )}

                    {/* Recurrence Indicators (Next due targets) */}
                    {(item.nextDueDate || item.nextDueOdometer) && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                        <span className="text-[9px] uppercase font-black text-indigo-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0 text-indigo-500" /> Next Target Event:
                        </span>
                        <div className="space-x-2 font-bold text-slate-800">
                          {item.nextDueDate && (
                            <span>{formatDate(item.nextDueDate)}</span>
                          )}
                          {item.nextDueDate && item.nextDueOdometer && <span className="text-slate-300">•</span>}
                          {item.nextDueOdometer && (
                            <span className="font-mono">{item.nextDueOdometer.toLocaleString()} {preferences.distanceUnit}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
                  <h4 className="font-extrabold text-sm text-slate-900">Delete Service Record?</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Irreversible Action</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to delete this maintenance entry? This will permanently delete this service log from your car's record history.
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
                      onDeleteLog(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/15"
                >
                  Delete Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
