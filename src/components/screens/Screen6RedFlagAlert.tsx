import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  HeartPulse,
  Activity,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Building,
  BellRing,
  HelpCircle,
} from 'lucide-react';
import { TriageAssessment, Vitals, Patient } from '../../types';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen6RedFlagAlertProps {
  patient: Patient;
  triage: TriageAssessment;
  vitals: Vitals;
  onUpdateTriage: (updates: Partial<TriageAssessment>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen6RedFlagAlert: React.FC<Screen6RedFlagAlertProps> = ({
  patient,
  triage,
  vitals,
  onUpdateTriage,
  onNext,
  onBack,
}) => {
  const isRed = triage.level === 'RED';
  const isYellow = triage.level === 'YELLOW';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Patient-Facing Banner - Calm Tone */}
      <div
        className={`rounded-2xl p-6 text-white shadow-xl border ${
          isRed
            ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-rose-800/40'
            : isYellow
            ? 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border-amber-800/40'
            : 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-emerald-800/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-white/20 border border-white/30 rounded text-[11px] font-mono uppercase tracking-wider">
                Step 6 of 10 • Clinical Safety & Priority Assessment
              </span>
              <span className="text-xs text-slate-300">प्राथमिकता एवं सुरक्षा समीक्षा</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              {isRed ? (
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              ) : (
                <HeartPulse className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <span>
                {isRed
                  ? 'Priority Medical Review Alert'
                  : isYellow
                  ? 'Expedited Clinical Review'
                  : 'Standard OPD Care Queue'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isRed
                ? 'Based on your reported symptom pattern, our hospital guidelines prioritize your consultation for prompt physician evaluation. Please remain comfortable.'
                : isYellow
                ? 'Your reported symptoms indicate an urgent review to avoid prolonged waiting.'
                : 'Your symptoms and vital signs indicate routine outpatient consultation.'}
            </p>
          </div>

          <div className="p-3.5 bg-white/10 backdrop-blur rounded-xl text-center self-start sm:self-center shrink-0 border border-white/20">
            <span className="text-[11px] font-bold text-slate-300 block uppercase">
              Triage Category
            </span>
            <span
              className={`text-base font-extrabold block ${
                isRed ? 'text-rose-300' : isYellow ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {isRed ? 'Priority Care (Red)' : isYellow ? 'Expedited (Yellow)' : 'Routine (Green)'}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">Token #{patient.tokenNumber}</span>
          </div>
        </div>
      </div>

      {/* Reported Symptom Pattern Explanation (No disease name per safety directive) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700" />
            <span>Reported Symptom Pattern Details</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">Clinical Safety Protocol</span>
        </div>

        {isRed ? (
          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span>Observed Symptom Pattern:</span>
            </div>
            <p className="text-xs text-rose-950 leading-relaxed font-medium">
              {triage.urgencyRationale ||
                'Reported acute chest discomfort accompanied by cold sweating and pain radiating to the arm.'}
            </p>
            <p className="text-[11px] text-rose-700 pt-1 border-t border-rose-200/60">
              * Note: In accordance with medical ethics and AI safety standards, this notice describes your reported symptoms only. A medical diagnosis will be provided exclusively by your treating doctor after clinical evaluation.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">No Acute Emergency Red-Flags Detected</span>
              <p className="text-slate-600 leading-relaxed">
                Your reported symptoms will be reviewed by the OPD medical officer in standard order.
              </p>
            </div>
          </div>
        )}

        {/* Patient Instructions Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <span className="font-bold text-slate-900 block">
            {isRed ? 'Instructions for Patient & Attendant:' : `Next Steps at ${CURRENT_HOSPITAL.name} OPD:`}
          </span>
          <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
            {isRed ? (
              <>
                <li>Please proceed directly to the <b>Priority Triage Counter (Room 102/Casualty)</b>.</li>
                <li>Remain comfortably seated and avoid sudden physical exertion.</li>
                <li>A triage nurse has been notified via the Staff Alert Queue.</li>
              </>
            ) : (
              <>
                <li>Proceed to scan any previous medical records or test reports.</li>
                <li>Your summary token will be issued for OPD Room {patient.tokenNumber % 10 + 101}.</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Recorded Vitals Overview */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Intake Vital Signs (वाइटल्स अवलोकन):
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">OPD Kiosk Sensors</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Blood Pressure</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {vitals.bpSystolic}/{vitals.bpDiastolic} mmHg
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Heart Pulse</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {vitals.pulseRate} bpm
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Oxygen (SpO2)</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {vitals.spo2}%
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px]">Body Temperature</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {vitals.temperature}°F
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
        >
          <span>Proceed to Document Scan & OCR (आगे बढ़ें)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
