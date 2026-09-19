import React, { useState } from 'react';
import {
  BellRing,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  User,
  Activity,
  AlertTriangle,
  Radio,
  CheckCheck,
  Building,
} from 'lucide-react';
import { OPDEncounter, Patient } from '../../types';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen12StaffAlertQueueProps {
  encounter: OPDEncounter;
  staffAuthenticated: boolean;
  onAuthenticateStaff: (isAuth: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

interface AlertItem {
  id: string;
  token: number;
  patientName: string;
  age: number;
  gender: string;
  priority: 'RED' | 'YELLOW';
  symptomPattern: string;
  vitals: string;
  timeAgo: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedRoom: string;
}

export const Screen12StaffAlertQueue: React.FC<Screen12StaffAlertQueueProps> = ({
  encounter,
  staffAuthenticated,
  onAuthenticateStaff,
  onNext,
  onBack,
}) => {
  const [staffIdInput, setStaffIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'RED' | 'YELLOW'>('ALL');

  // Realistic triage queue items
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alt-active',
      token: encounter.tokenNumber,
      patientName: encounter.patient.name,
      age: encounter.patient.age,
      gender: encounter.patient.gender,
      priority: encounter.triage.level === 'RED' ? 'RED' : 'YELLOW',
      symptomPattern:
        encounter.triage.urgencyRationale ||
        'Acute chest discomfort with reported arm radiation and cold diaphoresis.',
      vitals: `BP: ${encounter.vitals.bpSystolic}/${encounter.vitals.bpDiastolic} mmHg • Pulse: ${encounter.vitals.pulseRate} bpm • SpO2: ${encounter.vitals.spo2}%`,
      timeAgo: 'Just now',
      status: 'PENDING',
      assignedRoom: 'Priority Triage (Room 102)',
    },
    {
      id: 'alt-2',
      token: 102,
      patientName: 'Kavita Devi',
      age: 63,
      gender: 'Female',
      priority: 'RED',
      symptomPattern: 'Reported sudden onset shortness of breath with high BP (178/104 mmHg).',
      vitals: 'BP: 178/104 mmHg • Pulse: 104 bpm • SpO2: 91%',
      timeAgo: '4 mins ago',
      status: 'ACKNOWLEDGED',
      assignedRoom: 'Casualty Bay 2',
    },
    {
      id: 'alt-3',
      token: 99,
      patientName: 'Mohd. Salim',
      age: 38,
      gender: 'Male',
      priority: 'YELLOW',
      symptomPattern: 'Reported acute severe right lower quadrant abdominal pain with fever.',
      vitals: 'BP: 124/80 mmHg • Pulse: 88 bpm • SpO2: 98%',
      timeAgo: '12 mins ago',
      status: 'RESOLVED',
      assignedRoom: 'General Surgery OPD 204',
    },
  ]);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
    );
  };

  const handleResolve = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a))
    );
  };

  // Staff Authorization Gate if not logged in
  if (!staffAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 text-rose-400 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider">
              Staff Alert Queue
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Staff Authorization Required
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Restricted to Hospital Triage Nurses, Casualty Officers, and Rapid Response Staff.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAuthenticateStaff(true);
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Employee ID:
              </label>
              <input
                type="text"
                value={staffIdInput}
                onChange={(e) => setStaffIdInput(e.target.value)}
                placeholder={`e.g. ${CURRENT_HOSPITAL.code}-NURSE-402`}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Staff Queue</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onAuthenticateStaff(true)}
              className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              1-Click Demo Login (Triage Staff)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.priority === filter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-400/40 rounded text-rose-300 text-[11px] font-mono uppercase tracking-wider">
                Staff Alert Queue
              </span>
              <span className="text-xs text-slate-300">कर्मचारी अलर्ट कतार</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <BellRing className="w-6 h-6 text-rose-400" />
              <span>Staff Triage Alert Queue</span>
            </h1>
            <p className="text-xs text-slate-300">
              Live monitoring of red-flag and expedited intake tokens across {CURRENT_HOSPITAL.name} OPD registration kiosks.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 bg-rose-900/50 border border-rose-700 text-rose-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              <span>
                {alerts.filter((a) => a.priority === 'RED' && a.status !== 'RESOLVED').length} Active
                Red Alerts
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('RED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'RED'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            Priority Red Only
          </button>
          <button
            type="button"
            onClick={() => setFilter('YELLOW')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'YELLOW'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-amber-800 hover:bg-amber-50'
            }`}
          >
            Expedited Yellow
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          Refreshed: Live Sensor Stream
        </span>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isRed = alert.priority === 'RED';
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl p-5 border-2 shadow-sm transition space-y-3 ${
                isRed ? 'border-rose-200 hover:border-rose-300' : 'border-amber-200 hover:border-amber-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                      isRed ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                    TOKEN #{alert.token}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {alert.patientName} ({alert.age}Y / {alert.gender})
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Location: {alert.assignedRoom}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-[11px] text-slate-400 font-mono">{alert.timeAgo}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                      alert.status === 'RESOLVED'
                        ? 'bg-slate-100 text-slate-600'
                        : alert.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
              </div>

              {/* Symptom Pattern & Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Reported Symptom Pattern:
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {alert.symptomPattern}
                  </p>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">
                    Intake Vitals:
                  </span>
                  <span className="text-slate-800 font-bold block">{alert.vitals}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Assigned Triage Nurse: Unit 1
                </span>

                <div className="flex items-center gap-2">
                  {alert.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => handleResolve(alert.id)}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark Attended</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Kiosk (बाहर निकलें)</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
        >
          <span>Complete Session & Exit (सत्र समाप्त करें)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
