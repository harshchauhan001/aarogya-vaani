import React from 'react';
import {
  User,
  Clock,
  MapPin,
  HeartPulse,
  Building,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Navigation,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { OPDEncounter } from '../../types';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockClinicalData';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen10PatientDashboardProps {
  encounter: OPDEncounter;
  onNext: () => void;
  onBack: () => void;
}

export const Screen10PatientDashboard: React.FC<Screen10PatientDashboardProps> = ({
  encounter,
  onNext,
  onBack,
}) => {
  const dept =
    HOSPITAL_DEPARTMENTS.find((d) => d.id === encounter.departmentId) || HOSPITAL_DEPARTMENTS[0];

  const currentServingToken = Math.max(1, encounter.tokenNumber - 2);
  const patientsAhead = Math.max(0, encounter.tokenNumber - currentServingToken);
  const estimatedWait = patientsAhead * 6;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Patient Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Step 9 of 10 • Patient Personal Dashboard
              </span>
              <span className="text-xs text-slate-300">रोगी व्यक्तिगत पोर्टल</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-emerald-400" />
              <span>Namaste, {encounter.patient.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Track your live appointment queue, consultation room directions, and health summary at {CURRENT_HOSPITAL.name}.
            </p>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center self-start sm:self-center shrink-0 border border-white/10">
            <span className="text-[10px] text-slate-300 block uppercase font-bold">Your Queue Token</span>
            <span className="text-2xl font-extrabold text-white block font-mono">#{encounter.tokenNumber}</span>
            <span className="text-[10px] text-emerald-300 font-semibold">{dept.name}</span>
          </div>
        </div>
      </div>

      {/* Live Queue Tracker Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Live OPD Queue Status (कतार की स्थिति)
            </h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Live Sync</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-xs font-semibold mb-1">Now Consulting</span>
            <span className="text-3xl font-extrabold text-slate-700 font-mono">
              #{currentServingToken}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">In Doctor's Room</span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-400 shadow-sm">
            <span className="text-emerald-900 block text-xs font-bold mb-1">Your Token</span>
            <span className="text-3xl font-extrabold text-emerald-800 font-mono">
              #{encounter.tokenNumber}
            </span>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">
              {patientsAhead === 0 ? 'You are Next!' : `${patientsAhead} Patients Ahead`}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-xs font-semibold mb-1">Est. Wait Time</span>
            <span className="text-3xl font-extrabold text-slate-700 font-mono">
              ~{estimatedWait}m
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Approx. Waiting</span>
          </div>
        </div>
      </div>

      {/* Hospital Wayfinding & Doctor Room Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Room & Directions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Consultation Room Location</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Room & Department:</span>
              <span className="font-bold text-slate-900 text-sm block">
                Room {dept.roomNumber} • {dept.name}
              </span>
              <span className="text-slate-600 block">
                Attending Doctor: <b>{dept.doctorName}</b> ({dept.doctorDegree})
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Walking Directions:</span>
              <p className="text-slate-700 leading-relaxed">
                Take Elevator / Stairs to <b>Ground Floor, OPD Block A</b>. Turn left past the pharmacy counter towards Consultation Suite #{dept.roomNumber}.
              </p>
            </div>
          </div>
        </div>

        {/* Patient Profile & Health Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Linked Ayushman Health Profile</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">ABHA ID</span>
              <span className="font-mono font-bold text-emerald-700 truncate block">
                {encounter.patient.abhaId}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">{CURRENT_HOSPITAL.code} UHID</span>
              <span className="font-mono font-semibold text-slate-800 truncate block">
                {encounter.patient.uhid}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
              <span className="font-mono font-semibold text-slate-800">
                {encounter.vitals.bpSystolic}/{encounter.vitals.bpDiastolic} mmHg
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Pulse / SpO2</span>
              <span className="font-mono font-semibold text-slate-800">
                {encounter.vitals.pulseRate} bpm / {encounter.vitals.spo2}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Intake history successfully synchronized with hospital database.</span>
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
          <span>Back to Summary Slip</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
        >
          <span>Complete Intake / View Token (पंजीकरण पूर्ण करें)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
