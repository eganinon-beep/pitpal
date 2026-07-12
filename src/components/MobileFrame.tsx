import React, { useState } from 'react';
import { 
  Car, Droplet, Wrench, Bell, LayoutDashboard, BarChart3, 
  Settings2, ShieldAlert, BadgeInfo, FileText,
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
  hideQuickAction?: boolean;
}

export default function MobileFrame({
  children,
  activeTab,
  setActiveTab,
  preferences,
  onUpdatePreferences,
  onOpenQuickLogRefill,
  onOpenQuickLogMaintenance,
  onOpenUpdateMileage,
  hideQuickAction = false
}: MobileFrameProps) {
  const [showPreferencesMenu, setShowPreferencesMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  React.useEffect(() => {
    if (hideQuickAction) {
      setShowQuickMenu(false);
    }
  }, [hideQuickAction]);

  return (
    <div className="w-full h-full h-[100dvh] bg-slate-50 flex flex-col items-center justify-center font-sans select-none" id="mobile-app-shell">
      {/* Visual background atmospheric lights on desktop */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none hidden md:block" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none hidden md:block" />

      {/* Main Bezel-Phone Container */}
      <div className="w-full max-w-md h-screen h-[100dvh] md:h-[850px] md:max-h-[90vh] bg-slate-50 border-0 md:border-[10px] md:border-slate-200 md:rounded-[42px] flex flex-col relative overflow-hidden shadow-2xl shadow-slate-350/40">
        
        {/* Global Toolbar Header - Settings, App Title */}
        <header className="h-14 bg-white border-b border-slate-200 px-5 flex justify-between items-center z-30 shrink-0 md:rounded-t-[32px]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-slate-100">
              <img 
                src="/app_icon.jpg" 
                alt="pitpal" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
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
                      <option value="AED">AED (د.إ)</option>
                      <option value="AFN">AFN (؋)</option>
                      <option value="ALL">ALL (L)</option>
                      <option value="AMD">AMD (֏)</option>
                      <option value="ANG">ANG (ƒ)</option>
                      <option value="AOA">AOA (Kz)</option>
                      <option value="ARS">ARS ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="AWG">AWG (ƒ)</option>
                      <option value="AZN">AZN (₼)</option>
                      <option value="BAM">BAM (KM)</option>
                      <option value="BBD">BBD ($)</option>
                      <option value="BDT">BDT (৳)</option>
                      <option value="BGN">BGN (лв)</option>
                      <option value="BHD">BHD (.د.ب)</option>
                      <option value="BIF">BIF (FBu)</option>
                      <option value="BMD">BMD ($)</option>
                      <option value="BND">BND ($)</option>
                      <option value="BOB">BOB ($b)</option>
                      <option value="BRL">BRL (R$)</option>
                      <option value="BSD">BSD ($)</option>
                      <option value="BTN">BTN (Nu.)</option>
                      <option value="BWP">BWP (P)</option>
                      <option value="BYN">BYN (Br)</option>
                      <option value="BZD">BZD (BZ$)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="CDF">CDF (FC)</option>
                      <option value="CHF">CHF (CHF)</option>
                      <option value="CLP">CLP ($)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="COP">COP ($)</option>
                      <option value="CRC">CRC (₡)</option>
                      <option value="CUP">CUP ($)</option>
                      <option value="CVE">CVE ($)</option>
                      <option value="CZK">CZK (Kč)</option>
                      <option value="DJF">DJF (Fdj)</option>
                      <option value="DKK">DKK (kr)</option>
                      <option value="DOP">DOP (RD$)</option>
                      <option value="DZD">DZD (دج)</option>
                      <option value="EGP">EGP (E£)</option>
                      <option value="ERN">ERN (Nfk)</option>
                      <option value="ETB">ETB (Br)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="FJD">FJD ($)</option>
                      <option value="FKP">FKP (£)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="GEL">GEL (₾)</option>
                      <option value="GHS">GHS (₵)</option>
                      <option value="GIP">GIP (£)</option>
                      <option value="GMD">GMD (D)</option>
                      <option value="GNF">GNF (FG)</option>
                      <option value="GTQ">GTQ (Q)</option>
                      <option value="GYD">GYD ($)</option>
                      <option value="HKD">HKD ($)</option>
                      <option value="HNL">HNL (L)</option>
                      <option value="HRK">HRK (kn)</option>
                      <option value="HTG">HTG (G)</option>
                      <option value="HUF">HUF (Ft)</option>
                      <option value="IDR">IDR (Rp)</option>
                      <option value="ILS">ILS (₪)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="IQD">IQD (د.ع)</option>
                      <option value="IRR">IRR (﷼)</option>
                      <option value="ISK">ISK (kr)</option>
                      <option value="JMD">JMD (J$)</option>
                      <option value="JOD">JOD (د.ا)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="KGS">KGS (сом)</option>
                      <option value="KHR">KHR (៛)</option>
                      <option value="KMF">KMF (CF)</option>
                      <option value="KPW">KPW (₩)</option>
                      <option value="KRW">KRW (₩)</option>
                      <option value="KWD">KWD (د.ك)</option>
                      <option value="KYD">KYD ($)</option>
                      <option value="KZT">KZT (₸)</option>
                      <option value="LAK">LAK (₭)</option>
                      <option value="LBP">LBP (ل.ل)</option>
                      <option value="LKR">LKR (₨)</option>
                      <option value="LRD">LRD ($)</option>
                      <option value="LSL">LSL (M)</option>
                      <option value="LYD">LYD (د.ل)</option>
                      <option value="MAD">MAD (د.م.)</option>
                      <option value="MDL">MDL (L)</option>
                      <option value="MGA">MGA (Ar)</option>
                      <option value="MKD">MKD (ден)</option>
                      <option value="MMK">MMK (K)</option>
                      <option value="MNT">MNT (₮)</option>
                      <option value="MOP">MOP (MOP$)</option>
                      <option value="MRU">MRU (UM)</option>
                      <option value="MUR">MUR (₨)</option>
                      <option value="MVR">MVR (Rf)</option>
                      <option value="MWK">MWK (MK)</option>
                      <option value="MXN">MXN ($)</option>
                      <option value="MYR">MYR (RM)</option>
                      <option value="MZN">MZN (MT)</option>
                      <option value="NAD">NAD ($)</option>
                      <option value="NGN">NGN (₦)</option>
                      <option value="NIO">NIO (C$)</option>
                      <option value="NOK">NOK (kr)</option>
                      <option value="NPR">NPR (₨)</option>
                      <option value="NZD">NZD ($)</option>
                      <option value="OMR">OMR (ر.ع.)</option>
                      <option value="PAB">PAB (B/.)</option>
                      <option value="PEN">PEN (S/.)</option>
                      <option value="PGK">PGK (K)</option>
                      <option value="PHP">PHP (₱)</option>
                      <option value="PKR">PKR (₨)</option>
                      <option value="PLN">PLN (zł)</option>
                      <option value="PYG">PYG (₲)</option>
                      <option value="QAR">QAR (ر.ق)</option>
                      <option value="RON">RON (lei)</option>
                      <option value="RSD">RSD (дин.)</option>
                      <option value="RUB">RUB (₽)</option>
                      <option value="RWF">RWF (FRw)</option>
                      <option value="SAR">SAR (ر.س)</option>
                      <option value="SBD">SBD ($)</option>
                      <option value="SCR">SCR (₨)</option>
                      <option value="SDG">SDG (ج.س.)</option>
                      <option value="SEK">SEK (kr)</option>
                      <option value="SGD">SGD ($)</option>
                      <option value="SHP">SHP (£)</option>
                      <option value="SLL">SLL (Le)</option>
                      <option value="SOS">SOS (Sh)</option>
                      <option value="SRD">SRD ($)</option>
                      <option value="SSP">SSP (£)</option>
                      <option value="STN">STN (Db)</option>
                      <option value="SVC">SVC (₡)</option>
                      <option value="SYP">SYP (ل.س)</option>
                      <option value="SZL">SZL (L)</option>
                      <option value="THB">THB (฿)</option>
                      <option value="TJS">TJS (ЅМ)</option>
                      <option value="TMT">TMT (T)</option>
                      <option value="TND">TND (د.ت)</option>
                      <option value="TOP">TOP (T$)</option>
                      <option value="TRY">TRY (₺)</option>
                      <option value="TTD">TTD ($)</option>
                      <option value="TWD">TWD (NT$)</option>
                      <option value="TZS">TZS (TSh)</option>
                      <option value="UAH">UAH (₴)</option>
                      <option value="UGX">UGX (USh)</option>
                      <option value="USD">USD ($)</option>
                      <option value="UYU">UYU ($)</option>
                      <option value="UZS">UZS (so'm)</option>
                      <option value="VES">VES (Bs.S)</option>
                      <option value="VND">VND (₫)</option>
                      <option value="VUV">VUV (Vt)</option>
                      <option value="WST">WST (WS$)</option>
                      <option value="XAF">XAF (FCFA)</option>
                      <option value="XCD">XCD ($)</option>
                      <option value="XOF">XOF (CFA)</option>
                      <option value="XPF">XPF (₣)</option>
                      <option value="YER">YER (﷼)</option>
                      <option value="ZAR">ZAR (R)</option>
                      <option value="ZMW">ZMW (ZK)</option>
                      <option value="ZWL">ZWL ($)</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Core Content Stage Viewport */}
        <main className="flex-1 flex flex-col min-h-0 bg-slate-50 relative overflow-hidden" id="mobile-viewport-main">
          {children}
        </main>

        {/* Global Floating Action Button Overlay & Button */}
        {!hideQuickAction && (
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
        )}

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
