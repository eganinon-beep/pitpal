import React, { useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { 
  PieChart, Download, Upload, Info, AlertCircle, BarChart3, TrendingUp
} from 'lucide-react';
import { Vehicle, FuelRefill, MaintenanceLog, UserPreferences, EfficiencyUnit } from '../types';
import { formatCurrency, formatEfficiency, calculateRefillEfficiencies } from '../utils';

interface ReportsTabProps {
  vehicles: Vehicle[];
  refills: FuelRefill[];
  maintenanceLogs: MaintenanceLog[];
  preferences: UserPreferences;
  selectedVehicleId: string | 'all';
  // Backup-Restore triggers
  onExportBackup: () => void;
  onImportBackup: (jsonData: string) => boolean;
}

export default function ReportsTab({
  vehicles,
  refills,
  maintenanceLogs,
  preferences,
  selectedVehicleId,
  onExportBackup,
  onImportBackup
}: ReportsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentVehicleRefills = selectedVehicleId === 'all'
    ? refills
    : refills.filter(r => r.vehicleId === selectedVehicleId);

  const currentVehicleMaintenance = selectedVehicleId === 'all'
    ? maintenanceLogs
    : maintenanceLogs.filter(m => m.vehicleId === selectedVehicleId);

  // 1. Calculate Fuel Efficiency over time (Chronological ascending)
  const refillsWithEfficiency = calculateRefillEfficiencies(refills, preferences);
  const filteredWithEff = selectedVehicleId === 'all'
    ? refillsWithEfficiency
    : refillsWithEfficiency.filter(r => r.vehicleId === selectedVehicleId);

  // Sort ascending by date for chart trend plotting
  const chartEfficiencyData = filteredWithEff
    .filter(r => r.efficiency && r.efficiency > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => {
      const vName = vehicles.find(v => v.id === r.vehicleId)?.name || 'Car';
      return {
        date: r.date.substring(5), // Show 'MM-DD'
        [vName]: Number(r.efficiency?.toFixed(2)),
        efficiency: Number(r.efficiency?.toFixed(2)),
        carName: vName
      };
    });

  // Calculate efficiency stats
  const allEffValues = chartEfficiencyData.map(d => d.efficiency);
  const bestEfficiency = allEffValues.length > 0 
    ? (preferences.efficiencyUnit === 'L/100km' ? Math.min(...allEffValues) : Math.max(...allEffValues))
    : null;

  // 2. Monthly Spending Analytics breakdown
  // Let's gather the previous 6 months of data
  const monthlyDataMap: { [monthKey: string]: { fuel: number; maintenance: number; label: string } } = {};
  
  // Initialize last 6 calendar months
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const nameStr = d.toLocaleDateString('en-US', { month: 'short' });
    monthlyDataMap[key] = {
      fuel: 0,
      maintenance: 0,
      label: `${nameStr} '${String(d.getFullYear()).substring(2)}`
    };
  }

  // Populate fuel spending
  currentVehicleRefills.forEach(r => {
    const key = r.date.substring(0, 7); // 'YYYY-MM'
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].fuel += r.totalCost;
    }
  });

  // Populate completed maintenance bills
  currentVehicleMaintenance
    .filter(m => m.status === 'Completed')
    .forEach(m => {
      const key = m.date.substring(0, 7); // 'YYYY-MM'
      if (monthlyDataMap[key]) {
         monthlyDataMap[key].maintenance += m.cost;
      }
    });

  // Convert monthly mapped record into plot array
  const monthlySpendingChartData = Object.keys(monthlyDataMap)
    .sort()
    .map(key => ({
      name: monthlyDataMap[key].label,
      Fuel: Number(monthlyDataMap[key].fuel.toFixed(2)),
      Maintenance: Number(monthlyDataMap[key].maintenance.toFixed(2)),
      Total: Number((monthlyDataMap[key].fuel + monthlyDataMap[key].maintenance).toFixed(2))
    }));

  const totalFuelSpend = currentVehicleRefills.reduce((sum, r) => sum + r.totalCost, 0);
  const totalMaintSpend = currentVehicleMaintenance
    .filter(m => m.status === 'Completed')
    .reduce((sum, m) => sum + m.cost, 0);
  const overallLifetimeSpend = totalFuelSpend + totalMaintSpend;

  // File import dispatcher
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (onImportBackup(content)) {
        alert('Database imported successfully!');
      } else {
        alert('Failed/Invalid configuration backup file uploaded.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24" id="reports-tab-container">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-xl font-sans tracking-tight font-bold text-slate-900">Diagnostics</h2>
        <p className="text-slate-550 text-xs font-semibold">Analyze expenses, efficiency trends, & backups</p>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8 p-6 bg-white border border-slate-200 rounded-3xl text-sm text-slate-500 font-semibold shadow-sm">
          No vehicles registered. Diagnostic charts require vehicle database history to compile.
        </div>
      ) : (
        <>
          {/* Spend Summary highlights */}
          <div className="grid grid-cols-3 gap-3 px-1">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Total spent</span>
              <span className="block text-sm font-extrabold text-slate-900 truncate">{formatCurrency(overallLifetimeSpend, preferences.currency)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="block text-[8px] uppercase tracking-wider font-bold text-emerald-600">Fuel cost</span>
              <span className="block text-sm font-extrabold text-slate-900 truncate">{formatCurrency(totalFuelSpend, preferences.currency)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="block text-[8px] uppercase tracking-wider font-bold text-indigo-600 font-bold font-sans">Service bills</span>
              <span className="block text-sm font-extrabold text-slate-900 truncate">{formatCurrency(totalMaintSpend, preferences.currency)}</span>
            </div>
          </div>

          {/* Chart 1: Fuel Efficiency Over Time */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-1.5 font-sans">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Fuel Efficiency Leg Trend
                </h4>
              </div>
              {bestEfficiency && (
                <div className="text-right">
                  <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest text-[7px]">Peak Rating</span>
                  <span className="block text-[10px] text-emerald-600 font-black">
                    {formatEfficiency(bestEfficiency, preferences.efficiencyUnit)}
                  </span>
                </div>
              )}
            </div>

            {chartEfficiencyData.length < 2 ? (
              <div className="h-48 flex flex-col justify-center items-center p-6 text-center border border-dashed border-slate-250 bg-slate-50/50 rounded-2xl space-y-1.5">
                <Info className="h-6 w-6 text-slate-400" />
                <p className="text-slate-500 text-xs font-semibold">Trend requires consecutive full tanks.</p>
                <p className="text-slate-405 text-[10px] leading-tight max-w-xs font-semibold text-slate-400">Please log at least 2 consecutive fuel refills checking "Filled to Full Tank" to compute Leg Efficiency values.</p>
              </div>
            ) : (
              <div className="h-56 w-full pr-2 text-[10px]" id="efficiency-line-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartEfficiencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={9} fontStyle="font-semibold" />
                    <YAxis stroke="#64748b" fontSize={9} fontStyle="font-semibold" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      labelClassName="text-slate-900 font-bold text-xs"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      name={preferences.efficiencyUnit}
                      stroke="#10b981" 
                      strokeWidth={3} 
                      activeDot={{ r: 6 }} 
                      dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Monthly Expenses bar plot */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-3">
            <div className="px-1">
              <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-1.5 font-sans">
                <BarChart3 className="h-4 w-4 text-indigo-600" /> Monthly Spending Split
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Fuel spend vs maintenance invoices</p>
            </div>

            <div className="h-56 w-full pr-2 text-[10px]" id="monthly-spending-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpendingChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" />
                  <Bar dataKey="Fuel" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Maintenance" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Database Management - Backup / Restore Local config */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Upload className="h-4 w-4 text-indigo-600" /> Database Backup
              </h4>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed font-medium">
              Maintain full ownership of your vehicle history data. Export records to back up or migrate across devices.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="export-backup-btn"
                onClick={onExportBackup}
                className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer shadow-sm"
              >
                <Download className="h-4 w-4 text-slate-500" /> Export Backup
              </button>

              <button
                id="import-backup-btn"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer shadow-sm"
              >
                <Upload className="h-4 w-4 text-slate-500" /> Import Backup
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </div>
        </>
      )}
    </div>
  );
}
