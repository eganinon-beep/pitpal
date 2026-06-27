import React, { useState, useEffect } from 'react';
import { 
  Car, Droplet, Wrench, Bell, LayoutDashboard, BarChart3, 
  Settings2, Wifi, Battery, ShieldAlert, BadgeInfo, FileText,
  Plus, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPreferences } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onOpenQuickLogRefill: () => void;
  onOpenQuickLogMaintenance: () => void;
  onOpenUpdateMileage: () => void;
}

export default function MobileFrame({
  children,
  activeTab,
  setActiveTab,
  preferences,
  onUpdatePreferences,
  onOpenQuickLogRefill,
  onOpenQuickLogMaintenance,
  onOpenUpdateMileage
}: MobileFrameProps) {
  const [systemTime, setSystemTime] = useState('');
  const [showPreferencesMenu, setShowPreferencesMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Update mock system status clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans select-none" id="mobile-app-shell">
      {/* Visual background atmospheric lights on desktop */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none hidden md:block" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none hidden md:block" />

      {/* Main Bezel-Phone Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-[850px] md:h-[850px] bg-slate-50 border-0 md:border-[10px] md:border-slate-200 md:rounded-[42px] flex flex-col relative overflow-hidden shadow-2xl shadow-slate-350/40">
        
        {/* Mock Notch and Status bar (Hidden on pure mobile to match native browser, displays on desktop) */}
        <div className="h-11 bg-white px-6 pt-3 flex justify-between items-center z-50 shrink-0 text-slate-700 md:rounded-t-[32px] border-b border-slate-100">
          <span className="text-[11px] font-bold tracking-tight font-sans">{systemTime || '09:41'}</span>
          
          {/* Dynamic Small Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-24 h-4 bg-slate-100 rounded-full border border-slate-200/50 hidden md:block" />
          
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-slate-500" />
            <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded-sm scale-90 border border-indigo-100 uppercase">LTE</span>
            <Battery className="h-4 w-4 text-slate-500" />
          </div>
        </div>

        {/* Global Toolbar Header - Settings, App Title */}
        <header className="h-14 bg-white border-b border-slate-200 px-5 flex justify-between items-center z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-xl max-w-max text-white shadow-sm">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 font-sans lowercase">pitpal</h1>
            </div>
          </div>

          {/* Quick Config Button */}
          <div className="relative">
            <button
              id="toolbar-preferences-btn"
              onClick={() => setShowPreferencesMenu(!showPreferencesMenu)}
              className={`p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition ${
                showPreferencesMenu ? 'bg-slate-100 text-indigo-600' : ''
              }`}
            >
              <Settings2 className="h-4 w-4" />
            </button>

            {/* Float Settings Popover Dropdown */}
            {showPreferencesMenu && (
              <>
                <div 
                  id="preferences-backdrop"
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowPreferencesMenu(false)} 
                />
                <div 
                  id="preferences-dropdown"
                  className="absolute right-0 mt-2 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl w-60 z-50 space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                    Configure Units
                  </h4>
                  
                  {/* Distance unit selection */}
                  <div className="space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Distance Units</span>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                      <button
                        id="pref-dist-km-btn"
                        onClick={() => {
                          onUpdatePreferences({ distanceUnit: 'km', efficiencyUnit: preferences.efficiencyUnit === 'mpg' ? 'L/100km' : preferences.efficiencyUnit });
                        }}
                        className={`py-1 text-[10px] font-semibold rounded-md transition ${
                          preferences.distanceUnit === 'km' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        KM (Kilometers)
                      </button>
                      <button
                        id="pref-dist-mi-btn"
                        onClick={() => {
                          onUpdatePreferences({ distanceUnit: 'mi', efficiencyUnit: 'mpg' });
                        }}
                        className={`py-1 text-[10px] font-semibold rounded-md transition ${
                          preferences.distanceUnit === 'mi' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        MI (Miles)
                      </button>
                    </div>
                  </div>

                  {/* Volume conversion unit selector */}
                  <div className="space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Fuel Volume Units</span>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                      <button
                        id="pref-vol-l-btn"
                        onClick={() => onUpdatePreferences({ volumeUnit: 'L' })}
                        className={`py-1 text-[10px] font-semibold rounded-md transition ${
                          preferences.volumeUnit === 'L' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        L (Liters)
                      </button>
                      <button
                        id="pref-vol-gal-btn"
                        onClick={() => onUpdatePreferences({ volumeUnit: 'gal' })}
                        className={`py-1 text-[10px] font-semibold rounded-md transition ${
                          preferences.volumeUnit === 'gal' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        GAL (US Gallons)
                      </button>
                    </div>
                  </div>

                  {/* Fuel efficiency unit configuration */}
                  <div className="space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Fuel Efficiency metrics</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                      <button
                        id="pref-eff-l100-btn"
                        onClick={() => onUpdatePreferences({ efficiencyUnit: 'L/100km' })}
                        className={`py-1 text-[10px] font-semibold rounded-md transition ${
                          preferences.efficiencyUnit === 'L/100km' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        L/100km
                      </button>
                      <button
                        id="pref-eff-kml-btn"
                        onClick={() => onUpdatePreferences({ efficiencyUnit: 'km/L' })}
                        className={`py-1 text-[10px] font-semibold rounded-md transition ${
                          preferences.efficiencyUnit === 'km/L' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        KM/L
                      </button>
                      <button
                        id="pref-eff-mpg-btn"
                        onClick={() => onUpdatePreferences({ efficiencyUnit: 'mpg' })}
                        className={`py-1 text-[10px] font-semibold rounded-md transition ${
                          preferences.efficiencyUnit === 'mpg' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        MPG
                      </button>
                    </div>
                  </div>

                  {/* Currency config selector */}
                  <div className="space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Currency</span>
                    <select
                      id="pref-currency-select"
                      value={preferences.currency || 'USD'}
                      onChange={e => onUpdatePreferences({ currency: e.target.value })}
                      className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[10px] focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="PHP">PHP (₱)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="SGD">SGD ($)</option>
                      <option value="NZD">NZD ($)</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Core Content Stage Viewport */}
        <main className="flex-1 overflow-y-auto px-5 pt-4 bg-slate-50 scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200">
          {children}
        </main>

        {/* Global Floating Action Button Overlay & Button */}
        <>
          <AnimatePresence>
            {showQuickMenu && (
              <motion.div
                id="fab-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQuickMenu(false)}
                className="absolute inset-0 bg-slate-950 z-35 md:rounded-[32px]"
              />
            )}
          </AnimatePresence>

          <div className="absolute bottom-[72px] right-6 z-40">
            <button
              id="fab-quick-action-btn"
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={`h-14 w-14 rounded-full text-white bg-indigo-600 border border-indigo-500 shadow-xl transition flex items-center justify-center hover:bg-black hover:border-black cursor-pointer ${
                showQuickMenu ? 'rotate-45 bg-slate-900 hover:bg-black border-slate-900 shadow-slate-950/20' : 'shadow-indigo-600/20'
              }`}
            >
              <Plus className="h-6 w-6" />
            </button>

            <AnimatePresence>
              {showQuickMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  className="absolute bottom-16 right-0 bg-white border border-slate-200 p-3.5 rounded-3xl shadow-2xl w-56 z-40 space-y-2.5 overflow-hidden text-slate-800"
                  id="fab-action-menu"
                >
                  <button
                    id="fab-refill-btn"
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenQuickLogRefill();
                    }}
                    className="flex items-center gap-3 px-2 py-2 h-10 w-full hover:bg-indigo-50 rounded-xl transition text-left text-slate-700 hover:text-indigo-600 cursor-pointer animate-none"
                  >
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Droplet className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold">Record Fuel Refill</span>
                  </button>

                  <button
                    id="fab-maintenance-btn"
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenQuickLogMaintenance();
                    }}
                    className="flex items-center gap-3 px-2 py-2 h-10 w-full hover:bg-indigo-50 rounded-xl transition text-left text-slate-700 hover:text-indigo-600 cursor-pointer animate-none"
                  >
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold">Record Service</span>
                  </button>

                  <button
                    id="fab-update-mileage-btn"
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenUpdateMileage();
                    }}
                    className="flex items-center gap-3 px-2 py-2 h-10 w-full hover:bg-indigo-50 rounded-xl transition text-left text-slate-700 hover:text-indigo-600 cursor-pointer animate-none"
                  >
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Gauge className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold">Record Mileage</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>

        {/* Bottom Tab Navigation Bar */}
        <nav className="h-16 bg-white border-t border-slate-250 pb-2.5 flex items-center justify-around z-30 shrink-0 text-slate-400 md:rounded-b-[32px]">
          {/* 1. Dashboard Tab */}
          <button
            id="nav-dashboard-tab"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              activeTab === 'dashboard' ? 'text-indigo-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span className="text-[9px] font-semibold mt-1">Dashboard</span>
          </button>

          {/* 2. Vehicles Tab */}
          <button
            id="nav-vehicles-tab"
            onClick={() => setActiveTab('vehicles')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              activeTab === 'vehicles' ? 'text-indigo-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Car className="h-4.5 w-4.5" />
            <span className="text-[9px] font-semibold mt-1">Garage</span>
          </button>

          {/* 5. Reminders/Documents Tab */}
          <button
            id="nav-reminders-tab"
            onClick={() => setActiveTab('reminders')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              activeTab === 'reminders' ? 'text-indigo-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span className="text-[9px] font-semibold mt-1">Documents</span>
          </button>

          {/* 6. Reports Tab */}
          <button
            id="nav-reports-tab"
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer ${
              activeTab === 'reports' ? 'text-indigo-600 font-extrabold scale-102' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            <span className="text-[9px] font-semibold mt-1">Reports</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
