import React, { useState, useEffect } from 'react';
import {motion, AnimatePresence } from 'motion/react';
import { Droplet, Plus, Trash2, Calendar, Gauge, Trash, Info, Check, X, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { FuelRefill, Vehicle, UserPreferences } from '../types';
import { formatCurrency, formatEfficiency, formatDate, calculateRefillEfficiencies, formatNumberWithCommas, parseNumberFromCommas } from '../utils';

interface FuelTabProps {
  refills: FuelRefill[];
  vehicles: Vehicle[];
  preferences: UserPreferences;
  selectedVehicleId: string | 'all';
  onAddRefill: (refill: Omit<FuelRefill, 'id'>) => void;
  onDeleteRefill: (id: string) => void;
  showAddFormImmediately?: boolean;
  onCloseImmediateForm?: () => void;
  hideList?: boolean;
}

export default function FuelTab({
  refills,
  vehicles,
  preferences,
  selectedVehicleId,
  onAddRefill,
  onDeleteRefill,
  showAddFormImmediately = false,
  onCloseImmediateForm,
  hideList = false
}: FuelTabProps) {
  const [showAddForm, setShowAddForm] = useState(showAddFormImmediately);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedReceiptPhoto, setSelectedReceiptPhoto] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState(
    selectedVehicleId !== 'all' ? selectedVehicleId : vehicles[0]?.id || ''
  );
  const [date, setDate] = useState('');
  const [odometer, setOdometer] = useState<number | string>('');
  const [volume, setVolume] = useState<number | string>('');
  const [pricePerUnit, setPricePerUnit] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [fullTank, setFullTank] = useState(true);
  const [gasStation, setGasStation] = useState('');
  const [fuelBrand, setFuelBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<string>('');

  const [formError, setFormError] = useState('');

  // Handle immediate form triggers from Quick Actions
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

  // Sync selected vehicle filtering in main interface
  const filteredRefills = selectedVehicleId === 'all'
    ? refills
    : refills.filter(r => r.vehicleId === selectedVehicleId);

  // Parse efficiencies
  const refillsWithEfficiency = calculateRefillEfficiencies(refills, preferences);
  const displayRefills = selectedVehicleId === 'all'
    ? refillsWithEfficiency
    : refillsWithEfficiency.filter(r => r.vehicleId === selectedVehicleId);

  // Sort refills chronologically descending for display
  const sortedDisplayRefills = [...displayRefills].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Auto-calculate remaining field when any two of volume, price, or total cost are provided
  const handleVolumeChange = (val: string) => {
    setVolume(val);
    const v = parseFloat(val);
    if (!isNaN(v) && v > 0) {
      const p = parseFloat(pricePerUnit);
      const c = parseFloat(totalCost);
      if (!isNaN(p) && p > 0) {
        setTotalCost(parseFloat((v * p).toFixed(2)).toString());
      } else if (!isNaN(c) && c > 0) {
        setPricePerUnit(parseFloat((c / v).toFixed(3)).toString());
      }
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerUnit(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0) {
      const v = parseFloat(volume);
      const c = parseFloat(totalCost);
      if (!isNaN(v) && v > 0) {
        setTotalCost(parseFloat((v * p).toFixed(2)).toString());
      } else if (!isNaN(c) && c > 0) {
        setVolume(parseFloat((c / p).toFixed(3)).toString());
      }
    }
  };

  const handleCostChange = (val: string) => {
    setTotalCost(val);
    const c = parseFloat(val);
    if (!isNaN(c) && c > 0) {
      const v = parseFloat(volume);
      const p = parseFloat(pricePerUnit);
      if (!isNaN(v) && v > 0) {
        setPricePerUnit(parseFloat((c / v).toFixed(3)).toString());
      } else if (!isNaN(p) && p > 0) {
        setVolume(parseFloat((c / p).toFixed(3)).toString());
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      
      // If file size exceeds 1.5MB (allowable size for localStorage)
      if (file.size > 1.5 * 1024 * 1024) {
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 1200; // max width/height
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
            setReceiptPhoto(compressedUrl);
          } else {
            setReceiptPhoto(imgUrl);
          }
        };
      } else {
        // Do not compress
        setReceiptPhoto(imgUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return setFormError('Please select a vehicle');
    if (!date) return setFormError('Date is required');
    if (odometer === '' || odometer <= 0) return setFormError('Odometer reading is required');
    if (volume === '' || volume <= 0) return setFormError('Volume is required');
    if (pricePerUnit === '' || pricePerUnit <= 0) return setFormError('Price per unit is required');
    if (totalCost === '' || totalCost <= 0) return setFormError('Total cost is required');

    // Validation against vehicle starting odometer or previous logs
    const selectedVeh = vehicles.find(v => v.id === vehicleId);
    if (selectedVeh && Number(odometer) < selectedVeh.currentOdometer) {
      // Just a warning or lock? Let's check: if odometer is less than starting odometer, alert!
      // But allow them to proceed in case of corrections, we just confirm.
    }

    // Check with previous refills of same vehicle
    const vehicleRefills = refills.filter(r => r.vehicleId === vehicleId);
    if (vehicleRefills.length > 0) {
      const highestOdo = Math.max(...vehicleRefills.map(r => r.odometer));
      if (Number(odometer) <= highestOdo) {
        return setFormError(`Odometer of ${odometer.toLocaleString()} matches or is lower than previous logged fill of ${highestOdo.toLocaleString()} ${preferences.distanceUnit}.`);
      }
    }

    onAddRefill({
      vehicleId,
      date,
      odometer: Number(odometer),
      volume: Number(volume),
      pricePerUnit: Number(pricePerUnit),
      totalCost: Number(totalCost),
      fullTank,
      gasStation: gasStation.trim() || undefined,
      fuelBrand: fuelBrand.trim() || undefined,
      notes: notes.trim() || undefined,
      receiptPhoto: receiptPhoto || undefined
    });

    // Reset Form
    setOdometer('');
    setVolume('');
    setPricePerUnit('');
    setTotalCost('');
    setFullTank(true);
    setGasStation('');
    setFuelBrand('');
    setNotes('');
    setReceiptPhoto('');
    setFormError('');
    setShowAddForm(false);
    if (onCloseImmediateForm) onCloseImmediateForm();
  };

  return (
    <div className="space-y-6 pb-24" id="fuel-tab-container">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-sans tracking-tight font-bold text-slate-900">Fuel Tracking</h2>
        </div>
        {!showAddForm && vehicles.length > 0 && (
          <button
            id="toggle-add-refill-btn"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/10"
          >
            <Plus className="h-3.5 w-3.5" /> Log Refill
          </button>
        )}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-8 p-6 bg-white border border-slate-200 rounded-3xl text-sm text-slate-500 shadow-sm font-semibold">
          Please add a vehicle in the <strong className="text-indigo-600">Garage</strong> tab first to track fuel entries.
        </div>
      )}

      {/* Add Refill Receipt Form */}
      <AnimatePresence>
        {showAddForm && vehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4 overflow-hidden"
            id="fuel-add-form"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="h-4 w-4 text-emerald-600" /> Log Refill
              </h3>
              <button
                id="cancel-add-refill-btn"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Tank Toggle */}
                <div className="col-span-1 sm:col-span-2 py-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
                    <input
                      id="refill-fulltank-checkbox"
                      type="checkbox"
                      checked={fullTank}
                      onChange={e => setFullTank(e.target.checked)}
                      className="w-5 h-5 rounded border border-slate-250 accent-indigo-600 shrink-0 bg-white"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">Filled to Full Tank</span>
                      <span className="text-[10px] text-slate-400 block font-semibold leading-tight">Must check both consecutive refuels to calculate accurate mileage metrics</span>
                    </div>
                  </label>
                </div>

                {/* Vehicle Selector */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 tracking-wider text-slate-450">Select Vehicle</label>
                  <select
                    id="refill-vehicle-selector"
                    value={vehicleId}
                    onChange={e => setVehicleId(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.year} {v.make} {v.model}) - {v.licensePlate}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Refill Date</label>
                  <input
                    id="refill-date-input"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold min-w-0"
                  />
                </div>

                {/* Odometer */}
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Odometer Status ({preferences.distanceUnit})
                  </label>
                  <input
                    id="refill-odometer-input"
                    type="text"
                    placeholder="Reading during fuel refill"
                    value={formatNumberWithCommas(odometer)}
                    onChange={e => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { setOdometer(rawVal); } }}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Volume */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Volume filled ({preferences.volumeUnit})
                  </label>
                  <input
                    id="refill-volume-input"
                    type="text"
                    step="0.01"
                    value={formatNumberWithCommas(volume)}
                    onChange={e => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { handleVolumeChange(rawVal); } }}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                 {/* Price Per Liter/Gallon */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Price / {preferences.volumeUnit} ({preferences.currency || 'USD'})
                  </label>
                  <input
                    id="refill-price-input"
                    type="text"
                    step="0.01"
                    value={formatNumberWithCommas(pricePerUnit)}
                    onChange={e => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { handlePriceChange(rawVal); } }}
                    onBlur={() => {
                      if (pricePerUnit !== '') {
                        setPricePerUnit(Number(pricePerUnit).toFixed(2));
                      }
                    }}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Total Cost */}
                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex justify-between">
                    <span>Total Bill ({preferences.currency || 'USD'})</span>
                    <span className="text-[9px] text-indigo-600 lowercase normal-case italic font-bold">Auto-calculates missing field</span>
                  </label>
                  <input
                    id="refill-totalcase-input"
                    type="text"
                    step="0.01"
                    value={formatNumberWithCommas(totalCost)}
                    onChange={e => { const rawVal = parseNumberFromCommas(e.target.value); if (rawVal === '' || /^\d*\.?\d*$/.test(rawVal)) { handleCostChange(rawVal); } }}
                    onBlur={() => {
                      if (totalCost !== '') {
                        setTotalCost(Number(totalCost).toFixed(2));
                      }
                    }}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-650 font-black text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Gas Station */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gas Station</label>
                  <input
                    id="refill-gas-station-input"
                    type="text"
                    value={gasStation}
                    onChange={e => setGasStation(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Fuel Brand */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fuel Brand</label>
                  <input
                    id="refill-fuel-brand-input"
                    type="text"
                    value={fuelBrand}
                    onChange={e => setFuelBrand(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 block font-semibold leading-tight">Octane 93, XCS, VPower, Gold, etc.</span>
                </div>

                {/* Notes */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes</label>
                  <input
                    id="refill-notes-input"
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Photo Upload of Receipt */}
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Receipt Photo (Optional)</label>
                  <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition gap-3 text-center">
                    <input
                      id="refill-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="refill-photo-input"
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-100 shrink-0 flex items-center gap-1.5 mx-auto animate-none"
                    >
                      <Camera className="h-3.5 w-3.5" /> Choose Photo
                    </label>
                    <div className="w-full flex justify-center">
                      {receiptPhoto ? (
                        <div className="flex items-center justify-between gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm max-w-xs w-full">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img src={receiptPhoto} alt="Receipt Preview" className="h-9 w-9 object-cover rounded-lg border border-slate-200 shrink-0" />
                            <span className="text-xs text-emerald-600 font-bold truncate">Photo Attached</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReceiptPhoto('')}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer shrink-0"
                            title="Remove Photo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium block text-center">No photo selected (Max 1.5MB for original size)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="submit-refill-btn"
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition mt-2 cursor-pointer shadow-sm"
              >
                Save Refill Information
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History log display */}
      {!hideList && (
        <div className="space-y-3.5">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Refills Timeline</h3>
        
        {sortedDisplayRefills.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl space-y-2 p-6 shadow-sm">
            <Droplet className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-xs font-semibold">No fuel logs registered for this vehicle.</p>
          </div>
        ) : (
          sortedDisplayRefills.map(r => {
            const vehicleObj = vehicles.find(v => v.id === r.vehicleId);

            return (
              <div
                key={r.id}
                className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col hover:border-slate-350 transition duration-200"
                id={`refill-item-${r.id}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl shrink-0 mt-0.5">
                      <Droplet className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      {selectedVehicleId === 'all' && vehicleObj && (
                        <span className="block text-[8px] font-black text-slate-400 tracking-wider uppercase mb-0.5">
                          {vehicleObj.name}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                        {r.gasStation ? (
                          <>
                            {r.gasStation}
                            {r.fuelBrand && <span className="text-slate-500 font-semibold text-[11px] ml-1.5">({r.fuelBrand})</span>}
                          </>
                        ) : r.fuelBrand ? (
                          r.fuelBrand
                        ) : r.notes || 'Gas Refill'}
                      </h4>
                      {r.gasStation && r.notes && (
                        <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">
                          {r.notes}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        {formatDate(r.date)} • <span className="font-mono text-slate-600 font-bold">{r.odometer.toLocaleString()} {preferences.distanceUnit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {r.receiptPhoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptPhoto(r.receiptPhoto!)}
                        className="p-0.5 border border-slate-200 rounded-xl hover:border-indigo-400 transition cursor-pointer bg-slate-50 shrink-0 self-center"
                        title="View Receipt Photo"
                      >
                        <img src={r.receiptPhoto} alt="Receipt Thumb" className="h-8 w-8 object-cover rounded-lg" />
                      </button>
                    )}

                    <div className="text-right">
                      <span className="block text-xs font-extrabold text-slate-900">{formatCurrency(r.totalCost, preferences.currency)}</span>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">
                        {r.volume} {preferences.volumeUnit} @ {formatCurrency(r.pricePerUnit, preferences.currency)}
                      </span>
                    </div>

                    <button
                      id={`delete-refill-${r.id}-btn`}
                      onClick={() => setDeleteConfirmId(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-100 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Efficiency calculation banner */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-between items-center px-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                    <Gauge className="h-3.5 w-3.5 text-slate-400" />
                    <span>Calculated Efficiency:</span>
                  </div>
                  {r.efficiency ? (
                    <span className="text-xs font-black text-emerald-600 tracking-tight bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                      {formatEfficiency(r.efficiency, preferences.efficiencyUnit)}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" /> Needs consecutive full tanks
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
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
                  <h4 className="font-extrabold text-sm text-slate-900">Delete Fuel Record?</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Irreversible Action</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to delete this fuel refill record? This will permanently delete this fuel receipt and may impact consecutive efficiency calculations.
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
                      onDeleteRefill(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/15"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Receipt Photo Viewer Modal */}
      <AnimatePresence>
        {selectedReceiptPhoto && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              id="photo-viewer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceiptPhoto(null)}
              className="absolute inset-0 bg-slate-950"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-50 bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-lg w-full overflow-hidden shadow-2xl space-y-3"
              id="photo-viewer-modal"
            >
              <div className="flex justify-between items-center text-white px-1">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-300">
                  <ImageIcon className="h-4 w-4 text-indigo-400" /> Receipt Image
                </span>
                <button
                  onClick={() => setSelectedReceiptPhoto(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-850 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative aspect-[3/4] sm:aspect-auto sm:max-h-[70vh] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                <img
                  src={selectedReceiptPhoto}
                  alt="Receipt Full View"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
