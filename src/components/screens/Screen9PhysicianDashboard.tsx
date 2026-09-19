import React, { useState } from 'react';
import {
  Stethoscope,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Activity,
  ArrowRight,
  ArrowLeft,
  User,
  Clock,
  Sparkles,
  ClipboardList,
  CheckSquare,
  Square,
  AlertCircle,
  Building,
} from 'lucide-react';
import { OPDEncounter, ScannedDocument } from '../../types';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen9PhysicianDashboardProps {
  encounter: OPDEncounter;
  scannedDocs: ScannedDocument[];
  staffAuthenticated: boolean;
  onAuthenticateStaff: (isAuth: boolean) => void;
  onUpdateEncounterStatus: (status: OPDEncounter['status']) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen9PhysicianDashboard: React.FC<Screen9PhysicianDashboardProps> = ({
  encounter,
  scannedDocs,
  staffAuthenticated,
  onAuthenticateStaff,
  onUpdateEncounterStatus,
  onNext,
  onBack,
}) => {
  const [staffIdInput, setStaffIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // SOAP Documentation state
  const [soapNote, setSoapNote] = useState({
    subjective: `${encounter.patient.name}, ${encounter.patient.age}Y/${encounter.patient.gender}, presents with ${encounter.history.hpi.chiefComplaint || 'symptoms'} since ${encounter.history.hpi.durationNumber} ${encounter.history.hpi.durationUnit}. Stated character: ${encounter.history.hpi.character || 'unspecified'}.`,
    objective: `BP: ${encounter.vitals.bpSystolic}/${encounter.vitals.bpDiastolic} mmHg, Pulse: ${encounter.vitals.pulseRate} bpm, SpO2: ${encounter.vitals.spo2}%, Temp: ${encounter.vitals.temperature}°F. Heart sounds S1 S2 heard. Chest clear bilaterally.`,
    assessment: `Clinical evaluation in progress for reported ${encounter.history.hpi.chiefComplaint}. Vital stability maintained.`,
    plan: '1. Standard 12-lead ECG.\n2. Routine blood workup.\n3. Prescribe symptomatic relief and lifestyle guidance.\n4. Review in OPD after 3 days.',
  });

  const [investigations, setInvestigations] = useState([
    { id: 'ecg', name: '12-Lead Electrocardiogram (ECG)', checked: encounter.triage.level === 'RED' },
    { id: 'cbc', name: 'Complete Blood Count (CBC) & ESR', checked: true },
    { id: 'trop', name: 'Serum Troponin-I Rapid Test', checked: encounter.triage.level === 'RED' },
    { id: 'lipid', name: 'Fasting Lipid Profile', checked: false },
    { id: 'rbs', name: 'Random Blood Sugar (RBS)', checked: true },
  ]);

  const [consultationCompleted, setConsultationCompleted] = useState(
    encounter.status === 'COMPLETED'
  );

  // Handle Staff Verification
  const handleVerifyStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffIdInput.trim() || pinInput.trim()) {
      onAuthenticateStaff(true);
      setAuthError(null);
    } else {
      setAuthError('Please enter a valid Staff Employee ID or PIN.');
    }
  };

  const handleQuickDemoAuth = () => {
    setStaffIdInput(`${CURRENT_HOSPITAL.code}-DOC-104`);
    setPinInput('1234');
    onAuthenticateStaff(true);
    setAuthError(null);
  };

  // Staff Authorization Gate Modal/View
  if (!staffAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider">
              Physician Clinical Dashboard
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Staff Authorization Required
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              This screen is restricted to attending OPD physicians and clinical officers. Please enter your Hospital Staff ID to access clinical charting.
            </p>
          </div>

          <form onSubmit={handleVerifyStaff} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital Staff ID / NMC Reg No:
              </label>
              <input
                type="text"
                value={staffIdInput}
                onChange={(e) => setStaffIdInput(e.target.value)}
                placeholder={`e.g. ${CURRENT_HOSPITAL.code}-DOC-104`}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Passcode / PIN:
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            {authError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Authorize Clinical Session</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleQuickDemoAuth}
              className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              1-Click Demo Login (Dr. A. Sharma, {CURRENT_HOSPITAL.shortName})
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-slate-800 underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Patient Summary</span>
          </button>
        </div>
      </div>
    );
  }

  // Physician Clinical Dashboard Content
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Physician Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Physician Clinical Dashboard
              </span>
              <span className="text-xs text-slate-300">Staff Verified: Dr. A. Sharma (MD)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-emerald-400" />
              <span>Physician Clinical Dashboard</span>
            </h1>
            <p className="text-xs text-slate-300">
              Active Consultation: {encounter.patient.name} ({encounter.patient.age}Y / {encounter.patient.gender}) • ABHA: {encounter.patient.abhaId}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-xs font-mono font-bold">
              TOKEN #{encounter.tokenNumber}
            </span>
            <button
              type="button"
              onClick={() => onAuthenticateStaff(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-600 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Patient Intake Findings (Left) & Clinical Note / Orders (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Intake Summary & Vitals */}
        <div className="space-y-5">
          {/* Patient Details & Vitals Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Kiosk Intake Findings
              </h2>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  encounter.triage.level === 'RED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                TRIAGE: {encounter.triage.level}
              </span>
            </div>

            <div className="space-y-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Chief Complaint:
                </span>
                <span className="font-bold text-slate-900">
                  {encounter.history.hpi.chiefComplaint || 'General OPD Consultation'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Duration & Progression:
                </span>
                <span>
                  {encounter.history.hpi.durationNumber} {encounter.history.hpi.durationUnit} ({encounter.history.hpi.progress || 'Stable'})
                </span>
              </div>

              {encounter.departmentId === 'dept_ayush' && encounter.history.ayushAssessment ? (
                <>
                  {encounter.history.ayushAssessment.prakritiVikriti && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Prakriti & Vikriti:</span>
                      <span>{encounter.history.ayushAssessment.prakritiVikriti}</span>
                    </div>
                  )}
                  {encounter.history.ayushAssessment.agniKoshtha && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Agni & Koshtha:</span>
                      <span>{encounter.history.ayushAssessment.agniKoshtha}</span>
                    </div>
                  )}
                  {encounter.history.ayushAssessment.nidraManas && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Nidra & Manas:</span>
                      <span>{encounter.history.ayushAssessment.nidraManas}</span>
                    </div>
                  )}
                  {encounter.history.ayushAssessment.balaAmaSweda && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Bala, Sweda & Ama:</span>
                      <span>{encounter.history.ayushAssessment.balaAmaSweda}</span>
                    </div>
                  )}
                  {encounter.history.ayushAssessment.rituAharaTriggers && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Ritu & Ahara:</span>
                      <span>{encounter.history.ayushAssessment.rituAharaTriggers}</span>
                    </div>
                  )}
                  {encounter.history.ayushAssessment.priorAyushLifestyle && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Prior AYUSH & Dinacharya:</span>
                      <span>{encounter.history.ayushAssessment.priorAyushLifestyle}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {encounter.history.hpi.character && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Character & Radiation:
                      </span>
                      <span>
                        {encounter.history.hpi.character} {encounter.history.hpi.radiation ? `-> ${encounter.history.hpi.radiation}` : ''}
                      </span>
                    </div>
                  )}

                  {encounter.history.associatedSymptoms?.length > 0 && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Associated Symptoms:
                      </span>
                      <span>{encounter.history.associatedSymptoms.join(', ')}</span>
                    </div>
                  )}
                </>
              )}

              {encounter.history.hpi.vernacularVoiceTranscript && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 italic text-[11px] text-slate-600">
                  "{encounter.history.hpi.vernacularVoiceTranscript}"
                </div>
              )}
            </div>

            {/* Vitals */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Recorded Vitals:
              </span>
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">BP</span>
                  <span className="font-bold text-slate-900">
                    {encounter.vitals.bpSystolic}/{encounter.vitals.bpDiastolic}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Pulse / SpO2</span>
                  <span className="font-bold text-slate-900">
                    {encounter.vitals.pulseRate} / {encounter.vitals.spo2}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Prior Records */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Attached Medical Records ({scannedDocs.length})
            </h3>
            {scannedDocs.length === 0 ? (
              <p className="text-slate-400 text-[11px]">No prior records scanned.</p>
            ) : (
              <div className="space-y-2">
                {scannedDocs.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block">{doc.name}</span>
                    <span className="text-[10px] text-slate-500 block">{doc.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Clinical SOAP Note & Order Entries */}
        <div className="lg:col-span-2 space-y-5">
          {/* SOAP Clinical Note Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Clinical SOAP Note (EMR Documentation)
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">ABDM EHR Entry</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  S - Subjective (Clinical History & Chief Complaints)
                </label>
                <textarea
                  rows={2}
                  value={soapNote.subjective}
                  onChange={(e) => setSoapNote({ ...soapNote, subjective: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  O - Objective (Examination & Physical Findings)
                </label>
                <textarea
                  rows={2}
                  value={soapNote.objective}
                  onChange={(e) => setSoapNote({ ...soapNote, objective: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  A - Assessment (Physician Clinical Impression)
                </label>
                <textarea
                  rows={2}
                  value={soapNote.assessment}
                  onChange={(e) => setSoapNote({ ...soapNote, assessment: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  P - Plan (Prescriptions, Investigations, Follow-Up)
                </label>
                <textarea
                  rows={2}
                  value={soapNote.plan}
                  onChange={(e) => setSoapNote({ ...soapNote, plan: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Diagnostic Investigations Order Checklist */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Order Diagnostic Investigations:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {investigations.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => {
                      setInvestigations((prev) =>
                        prev.map((item) =>
                          item.id === inv.id ? { ...item, checked: !item.checked } : item
                        )
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      inv.checked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {inv.checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs truncate">{inv.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Finalize Consultation Action */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sign-off: Dr. A. Sharma, MD (NMC-849201)</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onUpdateEncounterStatus('COMPLETED');
                  setConsultationCompleted(true);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 ${
                  consultationCompleted
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{consultationCompleted ? 'Consultation Finalized ✓' : 'Finalize & Sign Encounter'}</span>
              </button>
            </div>
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
          <span>Back to Patient Summary</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
        >
          <span>View Patient Personal Dashboard (रोगी व्यक्तिगत डैशबोर्ड)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
