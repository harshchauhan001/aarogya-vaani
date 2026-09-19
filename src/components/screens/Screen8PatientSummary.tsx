import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  HeartPulse,
  Download,
  Building,
  Clock,
  MapPin,
  FileCheck2,
} from 'lucide-react';
import { OPDEncounter, ScannedDocument } from '../../types';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockClinicalData';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen8PatientSummaryProps {
  encounter: OPDEncounter;
  scannedDocs: ScannedDocument[];
  onNext: () => void;
  onBack: () => void;
}

export const Screen8PatientSummary: React.FC<Screen8PatientSummaryProps> = ({
  encounter,
  scannedDocs,
  onNext,
  onBack,
}) => {
  const [printed, setPrinted] = useState(false);
  const dept =
    HOSPITAL_DEPARTMENTS.find((d) => d.id === encounter.departmentId) || HOSPITAL_DEPARTMENTS[0];

  const handlePrint = () => {
    window.print();
    setPrinted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Step 8 of 10 • Patient Summary Confirmation
              </span>
              <span className="text-xs text-slate-300">रोगी सारांश एवं परामर्श पर्ची</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>OPD Registration Slip & Intake Summary</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Your digital intake has been recorded and transmitted to the treating doctor. Please confirm your details and print or save your token slip.
            </p>
          </div>

          <div className="flex gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable OPD Slip Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-300 space-y-6 font-sans">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
              <HeartPulse className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight uppercase text-slate-900">
                {encounter.hospitalName || encounter.patient.activeHospitalName || CURRENT_HOSPITAL.name}
              </h2>
              <p className="text-xs text-slate-600 font-semibold">
                Outpatient Department (OPD) • {dept.name} • Room {dept.roomNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                Ayushman Bharat Digital Mission (ABDM) Integrated Clinic Record
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right font-mono text-xs">
            <span className="block text-3xl font-extrabold text-slate-900">
              TOKEN #{encounter.tokenNumber}
            </span>
            <span className="text-[11px] text-slate-500">
              Date: {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Room & Queue Routing Banner */}
        <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-emerald-950 block text-sm">
                Assigned Consultation Room: Room {dept.roomNumber}
              </span>
              <span className="text-emerald-800">
                Doctor: {dept.doctorName} ({dept.doctorDegree})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-900 font-semibold shrink-0">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Est. Wait Time: ~15 mins</span>
          </div>
        </div>

        {/* Demographics & Vitals Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name:</span>
            <span className="font-bold text-slate-900">{encounter.patient.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Age / Gender:</span>
            <span className="font-semibold text-slate-900">
              {encounter.patient.age} Y / {encounter.patient.gender}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold text-emerald-800">
              ABHA ID (National):
            </span>
            <span className="font-mono font-bold text-emerald-700">{encounter.patient.abhaId}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Hospital UHID:</span>
            <span className="font-mono font-bold text-slate-900">{encounter.patient.uhid}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Blood Pressure:</span>
            <span className="font-mono font-bold text-slate-900">
              {encounter.vitals.bpSystolic}/{encounter.vitals.bpDiastolic} mmHg
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Pulse / SpO2:</span>
            <span className="font-mono font-bold text-slate-900">
              {encounter.vitals.pulseRate} bpm / {encounter.vitals.spo2}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Temperature:</span>
            <span className="font-mono font-bold text-slate-900">
              {encounter.vitals.temperature}°F
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Priority Triage:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block ${
                encounter.triage.level === 'RED'
                  ? 'bg-rose-100 text-rose-800'
                  : encounter.triage.level === 'YELLOW'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              LEVEL {encounter.triage.level}
            </span>
          </div>
        </div>

        {/* Patient-Reported Symptoms & History Summary (CRITICAL: No diagnosis codes or conclusions per Step 5) */}
        <div className="space-y-4 text-xs">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Patient-Reported Symptoms & History Summary
            </h3>
            <p className="text-[11px] text-slate-500">
              Factual record of complaints and history stated by patient during kiosk intake
            </p>
          </div>

          <div className="space-y-2 text-slate-800">
            <p>
              <b>Stated Chief Complaint:</b>{' '}
              {encounter.history.hpi.chiefComplaint || 'Consultation intake'} (
              {encounter.history.hpi.durationNumber} {encounter.history.hpi.durationUnit})
            </p>

            {encounter.departmentId === 'dept_ayush' && encounter.history.ayushAssessment ? (
              <>
                {encounter.history.ayushAssessment.prakritiVikriti && (
                  <p><b>Prakriti & Vikriti:</b> {encounter.history.ayushAssessment.prakritiVikriti}</p>
                )}
                {encounter.history.ayushAssessment.agniKoshtha && (
                  <p><b>Agni & Koshtha:</b> {encounter.history.ayushAssessment.agniKoshtha}</p>
                )}
                {encounter.history.ayushAssessment.nidraManas && (
                  <p><b>Nidra & Manas:</b> {encounter.history.ayushAssessment.nidraManas}</p>
                )}
                {encounter.history.ayushAssessment.balaAmaSweda && (
                  <p><b>Bala, Sweda & Ama:</b> {encounter.history.ayushAssessment.balaAmaSweda}</p>
                )}
                {encounter.history.ayushAssessment.rituAharaTriggers && (
                  <p><b>Ritu & Ahara:</b> {encounter.history.ayushAssessment.rituAharaTriggers}</p>
                )}
                {encounter.history.ayushAssessment.priorAyushLifestyle && (
                  <p><b>Prior AYUSH & Dinacharya:</b> {encounter.history.ayushAssessment.priorAyushLifestyle}</p>
                )}
              </>
            ) : (
              <>
                {encounter.history.hpi.character && (
                  <p>
                    <b>Symptom Character:</b> {encounter.history.hpi.character}
                    {encounter.history.hpi.radiation && ` (Radiating to ${encounter.history.hpi.radiation})`}
                  </p>
                )}

                {encounter.history.associatedSymptoms?.length > 0 && (
                  <p>
                    <b>Associated Symptoms Reported:</b>{' '}
                    {encounter.history.associatedSymptoms.join(', ')}
                  </p>
                )}
              </>
            )}

            {encounter.history.hpi.vernacularVoiceTranscript && (
              <p className="text-slate-600 italic text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <b>Patient Vernacular Intake:</b> "{encounter.history.hpi.vernacularVoiceTranscript}"
              </p>
            )}

            {scannedDocs.length > 0 && (
              <p className="text-slate-700">
                <b>Attached Prior Medical Records:</b> {scannedDocs.map((d) => d.name).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center shrink-0">
              <QrCode className="w-12 h-12 text-slate-800" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">ABDM PHR Sync QR</span>
              <span>Scan with Aarogya Setu or ABHA App to save digital token</span>
            </div>
          </div>

          <div className="text-center sm:text-right font-mono">
            <span className="block font-bold text-slate-800">
              Signature / Verification: SYSTEM GENERATED
            </span>
            <span>ABDM-NRCES FHIR R4 Compliant Intake Slip</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document Scan</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
        >
          <span>View Queue Status & Token (कतार स्थिति देखें)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
