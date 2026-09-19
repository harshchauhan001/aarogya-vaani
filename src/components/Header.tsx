import React from 'react';
import {
  Volume2,
  VolumeX,
  Languages,
  HeartPulse,
  Building,
  ShieldCheck,
  Lock,
  MapPin,
  Settings as SettingsIcon,
} from 'lucide-react';
import { HospitalFacility, ScreenId } from '../types';
import { SUPPORTED_HOSPITALS } from '../data/hospitals';

interface HeaderProps {
  currentScreen: ScreenId;
  selectedLanguage: string;
  onOpenLanguageModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  staffAuthenticated: boolean;
  onOpenStaffPortal: () => void;
  hospital: HospitalFacility;
  onSelectHospital: (hospital: HospitalFacility) => void;
  activeEncountersCount: {
    total: number;
    red: number;
    yellow: number;
    green: number;
  };
  onOpenAccessibilityModal: () => void;
  textSize?: 'normal' | 'large' | 'xlarge';
  onCycleTextSize?: () => void;
  contrastMode?: 'default' | 'high-contrast' | 'yellow-black';
  onCycleContrast?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  selectedLanguage,
  onOpenLanguageModal,
  soundEnabled,
  onToggleSound,
  staffAuthenticated,
  onOpenStaffPortal,
  hospital,
  onSelectHospital,
  activeEncountersCount,
  onOpenAccessibilityModal,
  textSize = 'normal',
  onCycleTextSize,
  contrastMode = 'default',
  onCycleContrast,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800">
      {/* Top Government & ABDM Bar */}
      <div className="bg-slate-950 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ABDM COMPLIANT (SIH26047)</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300">
            Ministry of Health & Family Welfare • {hospital.name} • {hospital.kioskIdentifier}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 hidden sm:inline">Live Triage Status:</span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800/80">
              🚨 {activeEncountersCount.red} Priority
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
              ✓ {activeEncountersCount.green} Routine
            </span>
          </div>
        </div>
      </div>

      {/* Main Branding & Utility Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand & Hospital Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-900/30">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">आरोग्यवाणी</span>
              <span className="text-sm font-semibold tracking-normal text-emerald-400 font-sans">
                AarogyaVaani
              </span>
            </div>
          </div>
        </div>

        {/* Action Utilities */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Fixed Kiosk Hospital Configuration Badge - Persistent on every screen */}
          <div
            id="kiosk-hospital-identity-badge"
            className="flex items-center space-x-2 sm:space-x-2.5 px-2.5 sm:px-3 py-1.5 bg-slate-800/95 text-slate-200 rounded-xl text-xs border border-slate-700/80 shadow-inner"
            title={`Deployment Terminal: ${hospital.name} (${hospital.id}) - ${hospital.kioskIdentifier}`}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left leading-tight">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white text-xs tracking-tight">
                  {hospital.name}
                </span>
                <span className="text-[9px] sm:text-[10px] bg-emerald-950 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-800/80 font-semibold">
                  {hospital.id}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] sm:text-[11px] text-slate-300 font-medium mt-0.5">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 shrink-0 inline" />
                <span className="truncate max-w-[130px] sm:max-w-none">{hospital.kioskIdentifier}</span>
              </div>
            </div>
          </div>

          {/* Hospital Staff Portal Trigger */}
          <button
            id="staff-portal-btn"
            onClick={onOpenStaffPortal}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              staffAuthenticated
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Hospital Staff Portal (Doctor / Triage Nurse)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              {staffAuthenticated ? 'Staff Active' : 'Staff Portal'}
            </span>
          </button>

          {/* Language Selector Trigger */}
          <button
            id="lang-modal-trigger-btn"
            onClick={onOpenLanguageModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
            title="Change Indian Language"
          >
            <Languages className="w-3.5 h-3.5 text-teal-400" />
            <span className="uppercase text-[11px] font-bold text-teal-300">{selectedLanguage}</span>
          </button>

          {/* Settings Modal Trigger */}
          <button
            id="header-settings-btn"
            onClick={onOpenAccessibilityModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition"
            title="Settings (सेटिंग्स)"
            aria-label="Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline text-[11px] font-medium text-emerald-300">Settings</span>
          </button>

          {/* Sound Synthesizer Chime Toggle */}
          <button
            id="audio-sound-toggle-btn"
            onClick={onToggleSound}
            className={`p-2 rounded-xl border text-xs transition ${
              soundEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={soundEnabled ? 'Hospital Chime Audio Enabled' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* DISHA / ABDM Badge */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-xl text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DISHA / ABDM Secure</span>
          </div>
        </div>
      </div>
    </header>
  );
};
