import React from 'react';
import { ScreenId } from '../types';
import {
  Languages,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  MessageSquare,
  AlertOctagon,
  Scan,
  CheckCircle2,
  Activity,
  User,
  Eye,
  BellRing,
  HeartHandshake,
  Lock,
} from 'lucide-react';

interface ScreenNavigationProps {
  currentScreen: ScreenId;
  maxUnlockedIndex: number;
  onNavigate: (screen: ScreenId) => void;
}

export interface StepDef {
  id: ScreenId;
  index: number;
  label: string;
  shortLabel: string;
  isStaffOnly?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export const ORDERED_STEPS: StepDef[] = [
  { id: ScreenId.WELCOME_LANGUAGE, index: 0, label: '1. Welcome & Language', shortLabel: '1. Lang', icon: Languages },
  { id: ScreenId.PATIENT_CONSENT, index: 1, label: '2. Patient Consent', shortLabel: '2. Consent', icon: ShieldCheck },
  { id: ScreenId.PATIENT_IDENTIFICATION, index: 2, label: '3. Identification', shortLabel: '3. ABHA', icon: UserCheck },
  { id: ScreenId.CONSULTATION_MODE, index: 3, label: '4. Mode Select', shortLabel: '4. Mode', icon: Stethoscope },
  { id: ScreenId.CONVERSATIONAL_CHAT, index: 4, label: '5. History Chat', shortLabel: '5. Chat', icon: MessageSquare },
  { id: ScreenId.RED_FLAG_ALERT, index: 5, label: '6. Red-Flag Alert', shortLabel: '6. Triage', icon: AlertOctagon },
  { id: ScreenId.DOCUMENT_SCAN, index: 6, label: '7. Document OCR', shortLabel: '7. Scan', icon: Scan },
  { id: ScreenId.PATIENT_SUMMARY, index: 7, label: '8. Summary Slip', shortLabel: '8. Slip', icon: CheckCircle2 },
  { id: ScreenId.PATIENT_DASHBOARD, index: 8, label: '9. Patient Portal', shortLabel: '9. Queue', icon: User },
  { id: ScreenId.SESSION_COMPLETE, index: 9, label: '10. Complete', shortLabel: '10. Done', icon: HeartHandshake },
];

interface ScreenNavigationProps {
  currentScreen: ScreenId;
  maxUnlockedIndex: number;
  staffAuthenticated: boolean;
  onNavigate: (screen: ScreenId) => void;
  onExitStaffMode: () => void;
}

export const ScreenNavigation: React.FC<ScreenNavigationProps> = ({
  currentScreen,
  maxUnlockedIndex,
  staffAuthenticated,
  onNavigate,
  onExitStaffMode,
}) => {
  const isStaffScreen =
    currentScreen === ScreenId.PHYSICIAN_DASHBOARD ||
    currentScreen === ScreenId.STAFF_ALERT_QUEUE;

  if (isStaffScreen) {
    return (
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>{staffAuthenticated ? 'Authorized Hospital Staff Area' : 'Staff Verification Required'}</span>
            </span>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
              {currentScreen === ScreenId.PHYSICIAN_DASHBOARD
                ? 'Physician Clinical Dashboard'
                : 'Triage Staff Alert Queue'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {staffAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate(ScreenId.PHYSICIAN_DASHBOARD)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    currentScreen === ScreenId.PHYSICIAN_DASHBOARD
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Physician Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(ScreenId.STAFF_ALERT_QUEUE)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    currentScreen === ScreenId.STAFF_ALERT_QUEUE
                      ? 'bg-rose-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Staff Alert Queue
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onExitStaffMode}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition"
            >
              Exit to Patient Kiosk
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = ORDERED_STEPS.find((s) => s.id === currentScreen) || ORDERED_STEPS[0];
  const progressPercent = Math.round(((currentStep.index + 1) / ORDERED_STEPS.length) * 100);

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
        {/* Step Status Indicator Bar */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold">
              Step {currentStep.index + 1} of {ORDERED_STEPS.length}
            </span>
            <span className="text-xs font-bold text-slate-800 truncate">
              {currentStep.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Progress: {progressPercent}%
            </span>
            <div className="w-24 sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Linear Step Tracker (Strict Linear Flow - Future steps locked) */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
          {ORDERED_STEPS.map((step) => {
            const Icon = step.icon;
            const isCurrent = step.id === currentScreen;
            const isUnlocked = step.index <= maxUnlockedIndex;
            const isCompleted = step.index < currentStep.index;

            return (
              <button
                key={step.id}
                id={`step-${step.id}`}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onNavigate(step.id)}
                title={
                  !isUnlocked
                    ? `Complete Step ${maxUnlockedIndex + 1} first`
                    : step.label
                }
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition shrink-0 ${
                  isCurrent
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                    : isUnlocked
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-60'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                />
                <span className="hidden lg:inline">{step.label}</span>
                <span className="lg:hidden">{step.shortLabel}</span>
                {isCompleted && !isCurrent && (
                  <span className="text-emerald-700 text-[10px] font-bold">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
