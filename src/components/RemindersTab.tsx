import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, CheckCircle2, AlertTriangle, Calendar, RefreshCcw, Trash2, X, AlertCircle, Edit, FileText, Check, Info } from 'lucide-react';
import { RenewalReminder, Vehicle, UserPreferences } from '../types';
import { formatDate } from '../utils';

interface RemindersTabProps {
  reminders: RenewalReminder[];
  vehicles: Vehicle[];
  onAddReminder: (reminder: Omit<RenewalReminder, 'id'>) => void;
  onUpdateReminderStatus: (id: string, updates: Partial<RenewalReminder>) => void;
  onDeleteReminder: (id: string) => void;
  showAddFormImmediately?: boolean;
  onCloseImmediateForm?: () => void;
  onShowAddFormChange?: (show: boolean) => void;
}

const REMINDER_TYPES = [
  { value: 'Registration', label: 'Vehicle Registration' },
  { value: 'License', label: "Driver's License" },
  { value: 'Insurance', label: 'Car Insurance Premium' },
  { value: 'Other', label: 'Other/Custom Document' }
];

export default function RemindersTab({
  reminders,
  vehicles,
  onAddReminder,
  onUpdateReminderStatus,
  onDeleteReminder,
  showAddFormImmediately = false,
  onCloseImmediateForm,
  onShowAddFormChange
}: RemindersTabProps) {
  const [showAddForm, setShowAddForm] = useState(showAddFormImmediately);

  useEffect(() => {
    onShowAddFormChange?.(showAddForm);
  }, [showAddForm, onShowAddFormChange]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | 'all'>('all');
  const [type, setType] = useState<'License' | 'Registration' | 'Insurance' | 'Other'>('Registration');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [alertDaysBefore, setAlertDaysBefore] = useState<number>(30);
  const [notes, setNotes] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  const [formError, setFormError] = useState('');

  // Sync Quick Actions FAB 
  useEffect(() => {
    if (showAddFormImmediately) {
      setShowAddForm(true);
      if (vehicles.length > 0) {
        setVehicleId(vehicles[0].id);
      }
    }
  }, [showAddFormImmediately, vehicles]);

  // Set default title when type changes (only when not editing)
  useEffect(() => {
    if (editingId) return;
    if (type === 'Registration') {
      const v = vehicles.find(car => car.id === vehicleId);
      setTitle(v ? `${v.name} Registration` : 'Annual Vehicle Registration');
    } else if (type === 'Insurance') {
      const v = vehicles.find(car => car.id === vehicleId);
      setTitle(v ? `${v.name} Insurance Renewal` : 'Automotive Insurance Renewal');
    } else if (type === 'License') {
      setTitle("Personal Driver's License");
    } else if (type === 'Other') {
      setTitle('Custom Deadline Alert');
    }
  }, [type, vehicleId, vehicles, editingId]);

  const handleStartEdit = (rem: RenewalReminder) => {
    setEditingId(rem.id);
    setVehicleId(rem.vehicleId);
    setType(rem.type);
    setTitle(rem.title);
    setDueDate(rem.dueDate);
    setAlertDaysBefore(rem.alertDaysBefore);
    setNotes(rem.notes || '');
    setShowAddForm(true);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dueDate) return setFormError('Due date/expiration is required.');
    if (!title.trim()) return setFormError('Document title is required.');

    if (editingId) {
      onUpdateReminderStatus(editingId, {
        vehicleId,
        type,
        title: title.trim(),
        dueDate,
        alertDaysBefore: Number(alertDaysBefore),
        notes: notes.trim() || undefined
      });
    } else {
      onAddReminder({
        vehicleId,
        type,
        title: title.trim(),
        dueDate,
        alertDaysBefore: Number(alertDaysBefore),
        completed: false,
        notes: notes.trim() || undefined
      });
    }

    // Reset Form
    setEditingId(null);
    setTitle('');
    setDueDate('');
    setAlertDaysBefore(30);
    setNotes('');
    setFormError('');
    setShowAddForm(false);
    if (onCloseImmediateForm) onCloseImmediateForm();
  };

  // Helper: check alert status of a reminder
  const getReminderStatus = (rem: RenewalReminder) => {
    if (rem.completed) return { state: 'completed', text: 'Archived', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(rem.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { state: 'overdue', text: 'Expired!', days: Math.abs(diffDays), color: 'text-rose-700 bg-rose-50 border-rose-150 animate-pulse' };
    } else if (diffDays <= rem.alertDaysBefore) {
      return { state: 'alarm', text: `Expires in ${diffDays} d`, days: diffDays, color: 'text-amber-700 bg-amber-50 border-amber-150 font-bold' };
    } else {
      return { state: 'upcoming', text: `Due in ${diffDays} d`, days: diffDays, color: 'text-slate-500 bg-slate-50 border-slate-100' };
    }
  };

  // Automated UX helper: bump deadline by +1 year
  const handleExtendOneYear = (rem: RenewalReminder) => {
    const origDate = new Date(rem.dueDate);
    origDate.setFullYear(origDate.getFullYear() + 1);
    const newDueDateStr = origDate.toISOString().split('T')[0];

    onUpdateReminderStatus(rem.id, {
      dueDate: newDueDateStr,
      completed: false // Keep it active for the next cycle!
    });
  };

  // Filter reminders list
  const activeReminders = reminders
    .filter(r => !r.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const completedReminders = reminders
    .filter(r => r.completed)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-6 pb-24" id="reminders-tab-container">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-sans tracking-tight font-bold text-slate-900">Documents</h2>
        </div>
        {!showAddForm && (
          <button
            id="toggle-add-reminder-btn"
            onClick={() => {
              setEditingId(null);
              setTitle('');
              setDueDate('');
              setAlertDaysBefore(30);
              setNotes('');
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/10 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Document
          </button>
        )}
      </div>

      {/* Add reminder entry panel */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              id="add-reminder-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                setFormError('');
                if (onCloseImmediateForm) onCloseImmediateForm();
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-5 w-full max-w-md relative z-50 space-y-4 text-left text-slate-800"
              id="reminders-add-form"
            >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" /> {editingId ? 'Edit Document Details' : 'Add Vehicle Document'}
              </h3>
              <button
                id="cancel-add-reminder-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
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
                <div className="p-3 bg-rose-50 border border-rose-225 rounded-xl text-rose-600 text-xs text-center font-bold flex items-center gap-2 justify-center">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Associated Vehicle */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Associated Vehicle</label>
                  <select
                    id="reminder-car-selector"
                    value={vehicleId}
                    onChange={e => setVehicleId(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none font-bold"
                  >
                    <option value="all">General / Personal Driver</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.year} {v.make} {v.model}) - {v.licensePlate}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Type */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Document Type</label>
                  <select
                    id="reminder-type-selector"
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none font-bold"
                  >
                    {REMINDER_TYPES.map(rt => (
                      <option key={rt.value} value={rt.value}>{rt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Document Title */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Document Title *</label>
                  <input
                    id="reminder-title-input"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none font-semibold"
                  />
                </div>

                {/* Expiration Date */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Expiration Date *</label>
                  <input
                    id="reminder-date-input"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none cursor-pointer font-semibold"
                  />
                </div>

                {/* Warning Alert Days */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Alert warning days</label>
                  <select
                    id="reminder-alert-days-selector"
                    value={alertDaysBefore}
                    onChange={e => setAlertDaysBefore(Number(e.target.value))}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="7">7 Days Prior</option>
                    <option value="15">15 Days Prior</option>
                    <option value="30">30 Days Prior</option>
                    <option value="45">45 Days Prior</option>
                    <option value="60">60 Days Prior</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Document Details & Notes</label>
                  <textarea
                    id="reminder-notes-input"
                    placeholder="Provide policy number, Smog check schedule, or other relevant document details..."
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <button
                id="submit-reminder-btn"
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition mt-2 cursor-pointer shadow-sm"
              >
                {editingId ? 'Save Document Changes' : 'Save Document Information'}
              </button>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lists of tasks */}
      <div className="space-y-6">
        
        {/* ACTIVE DEADLINES */}
        <div className="space-y-3.5 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Documents ({activeReminders.length})</h3>

          {activeReminders.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-slate-500 text-xs font-semibold">No pending vehicle registration, license or documents due!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeReminders.map(rem => {
                const badge = getReminderStatus(rem);
                const vehicleObj = vehicles.find(v => v.id === rem.vehicleId);

                return (
                  <div
                    key={rem.id}
                    className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col hover:border-slate-350 transition duration-200"
                    id={`active-reminder-card-${rem.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-slate-50 text-indigo-600 border border-slate-100 rounded-2xl shrink-0 mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          {vehicleObj && (
                            <span className="block text-[8px] font-black text-slate-400 tracking-wider uppercase mb-0.5">
                              {vehicleObj.name}
                            </span>
                          )}
                           <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {rem.title}
                          </h4>
                          <span className="block text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Expiration: <strong className="text-slate-800">{formatDate(rem.dueDate)}</strong>
                          </span>
                          {rem.expirationFrequency && rem.expirationFrequency !== 'specific-date' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 mt-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 shrink-0">
                              <RefreshCcw className="h-2.5 w-2.5" />
                              {rem.expirationFrequency === 'every-2nd-day' ? 'Repeats Every 2nd Day' : `Repeats Every 3rd Week of ${rem.selectedMonth}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>

                    {rem.notes && (
                      <p className="text-[10px] text-slate-655 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-3.5 leading-relaxed font-semibold">
                        {rem.notes}
                      </p>
                    )}

                    {/* Quick check off footer */}
                    <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex justify-between items-center px-1">
                      <button
                        id={`mark-renewed-${rem.id}-btn`}
                        onClick={() => setArchiveConfirmId(rem.id)}
                        className="text-[10px] text-indigo-650 hover:text-indigo-805 font-black transition flex items-center gap-1 underline cursor-pointer uppercase tracking-wider"
                      >
                        Archive
                      </button>
 
                       <div className="flex items-center gap-2">
                         {/* Edit button */}
                         <button
                           id={`edit-reminder-${rem.id}-btn`}
                           onClick={() => handleStartEdit(rem)}
                           className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl transition cursor-pointer"
                           title="Edit Document Details"
                         >
                           <Edit className="h-3.5 w-3.5" />
                         </button>
 
                         {/* Auto frequency bumper */}
                         <button
                           id={`extend-year-${rem.id}-btn`}
                           onClick={() => handleExtendOneYear(rem)}
                           className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                           title="Extend deadline by +1 calendar year"
                         >
                           <RefreshCcw className="h-3 w-3 text-slate-500" />{' '}
                           +1 Year
                         </button>
 
                         <button
                           id={`delete-reminder-${rem.id}-btn`}
                           onClick={() => setDeleteConfirmId(rem.id)}
                           className="p-1 px-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-100 rounded-xl transition cursor-pointer"
                         >
                           <Trash2 className="h-3.5 w-3.5" />
                         </button>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
 
         {/* COMPLETED/RENEWED ARCHIVE */}
         {completedReminders.length > 0 && (
           <div className="space-y-3.5 px-1">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archived Documents ({completedReminders.length})</h3>
             
             <div className="space-y-3">
               {completedReminders.map(rem => {
                 const vehicleObj = vehicles.find(v => v.id === rem.vehicleId);
 
                 return (
                   <div
                     key={rem.id}
                     className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col hover:border-slate-350 transition duration-150 animate-fade-in"
                     id={`archived-reminder-card-${rem.id}`}
                   >
                     {/* Row 1: Icon and Title */}
                     <div className="flex items-start gap-3">
                       <div className="p-2.5 bg-slate-50 text-emerald-600 border border-slate-100 rounded-2xl shrink-0 mt-0.5">
                         <CheckCircle2 className="h-4 w-4" />
                       </div>
                       <div className="flex-1 min-w-0">
                         {vehicleObj && (
                           <span className="block text-[8px] font-black text-slate-400 tracking-wider uppercase mb-0.5">
                             {vehicleObj.name}
                           </span>
                         )}
                         <h4 className="text-xs font-bold text-slate-550 leading-tight">
                           {rem.title}
                         </h4>
                       </div>
                     </div>
 
                     {/* Row 2: Archived Date below document title */}
                     <div className="mt-2.5 pl-11">
                       <span className="inline-flex items-center gap-1 text-[10px] text-slate-450 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                         <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Archived Date: {formatDate(rem.dueDate)}
                       </span>
                     </div>
 
                     {/* Row 3: Action Buttons below archived date */}
                     <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2 pl-11">
                       {/* Edit archived document */}
                       <button
                         id={`edit-archived-reminder-${rem.id}-btn`}
                         onClick={() => handleStartEdit(rem)}
                         className="p-1 px-1.5 text-slate-450 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl transition cursor-pointer"
                         title="Edit Document Details"
                       >
                         <Edit className="h-3.5 w-3.5" />
                       </button>
 
                       <button
                         id={`reactivate-reminder-${rem.id}-btn`}
                         onClick={() => onUpdateReminderStatus(rem.id, { completed: false })}
                         className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded-xl transition cursor-pointer"
                       >
                         <RefreshCcw className="h-3 w-3" /> Reactivate
                       </button>
                       
                       <button
                         id={`delete-archived-${rem.id}-btn`}
                         onClick={() => onDeleteReminder(rem.id)}
                         className="p-1 px-1.5 text-slate-450 hover:text-rose-600 transition cursor-pointer bg-slate-50 hover:bg-rose-50 border border-slate-100 rounded-xl ml-auto"
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         )}
 
       </div>
 
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
                   <h4 className="font-extrabold text-sm text-slate-900">Delete Document?</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Irreversible Action</p>
                 </div>
               </div>
 
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 Are you sure you want to delete this document alert? This will permanently delete this document records.
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
                       onDeleteReminder(deleteConfirmId);
                       setDeleteConfirmId(null);
                     }
                   }}
                   className="flex-1 h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/15"
                 >
                   Delete Document
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Custom Archive Confirmation Modal */}
       <AnimatePresence>
         {archiveConfirmId && (
           <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
             <motion.div
               id="archive-confirm-backdrop"
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.4 }}
               exit={{ opacity: 0 }}
               onClick={() => setArchiveConfirmId(null)}
               className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
             />
             
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm relative z-50 space-y-4 shadow-2xl"
               id="archive-confirm-modal"
             >
               <div className="flex items-center gap-3 text-amber-600">
                 <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-100 shrink-0">
                   <FileText className="h-5 w-5" />
                 </div>
                 <div>
                   <h4 className="font-extrabold text-sm text-slate-900">Archive Document?</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Archive Status</p>
                 </div>
               </div>
 
               <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                 Do you want to archive document? You will not be able to receive reminders for this document.
               </p>
 
               <div className="flex gap-2.5 pt-2">
                 <button
                   id="cancel-archive-btn"
                   type="button"
                   onClick={() => setArchiveConfirmId(null)}
                   className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                 >
                   Cancel
                 </button>
                 <button
                   id="confirm-archive-btn"
                   type="button"
                   onClick={() => {
                     if (archiveConfirmId) {
                       onUpdateReminderStatus(archiveConfirmId, { completed: true });
                       setArchiveConfirmId(null);
                     }
                   }}
                   className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/15"
                 >
                   Archive
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}
