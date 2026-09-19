import React from 'react';
import {
  Stethoscope,
  Leaf,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  Sparkles,
  Activity,
  Heart,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { ConsultationMode, Department } from '../../types';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockClinicalData';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen4ConsultationModeProps {
  consultationMode: ConsultationMode;
  selectedDepartmentId: string;
  onSelectMode: (mode: ConsultationMode) => void;
  onSelectDepartment: (deptId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen4ConsultationMode: React.FC<Screen4ConsultationModeProps> = ({
  consultationMode,
  selectedDepartmentId,
  onSelectMode,
  onSelectDepartment,
  onNext,
  onBack,
}) => {
  const isGeneral = consultationMode === 'GENERAL';
  const isAyush = consultationMode === 'AYUSH';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Step 4 of 10 • Consultation Mode Selection
              </span>
              <span className="text-xs text-slate-300">परामर्श पद्धति का चयन</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building className="w-6 h-6 text-emerald-400" />
              <span>Choose Your Clinical Consultation System</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {CURRENT_HOSPITAL.name} offers both modern General Medicine (Allopathy) and traditional AYUSH integrated clinical streams under National Health Mission guidelines.
            </p>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center self-start sm:self-center shrink-0 border border-white/10">
            <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">Dual System Intake</span>
            <span className="text-[10px] text-slate-300">ABDM Standard</span>
          </div>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Option 1: General Medicine (Allopathy) */}
        <div
          onClick={() => {
            onSelectMode('GENERAL');
            onSelectDepartment('dept_medicine');
          }}
          className={`p-6 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
            isGeneral
              ? 'border-emerald-600 bg-emerald-50/70 shadow-lg ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1.5">
                {isGeneral && (
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                Modern Evidence-Based OPD
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                General Medicine (Allopathy)
              </h2>
              <p className="text-xs text-slate-500">
                सामान्य चिकित्सा एवं विशेषज्ञ ओपीडी
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Standard clinical evaluation covering acute complaints, chronic conditions (diabetes, hypertension, cardiac), lab investigations, and prescription of evidence-based medicines.
            </p>

            <div className="pt-2 border-t border-slate-200/70 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-700" />
                <span>History Protocol: <b>OPQRST</b> & Red-Flag Triage Check</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-emerald-700" />
                <span>Key Clinics: Internal Medicine, Cardiology, Pulmonology</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>Primary Care Stream</span>
            <span className="underline">Select General Mode &rarr;</span>
          </div>
        </div>

        {/* Option 2: AYUSH Holistic System */}
        <div
          onClick={() => {
            onSelectMode('AYUSH');
            onSelectDepartment('dept_ayush');
          }}
          className={`p-6 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
            isAyush
              ? 'border-emerald-600 bg-emerald-50/70 shadow-lg ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-md">
                <Leaf className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1.5">
                {isAyush && (
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800 font-bold block">
                Integrated Holistic OPD
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                AYUSH Stream (आयुष चिकित्सा)
              </h2>
              <p className="text-xs text-slate-500">
                Ayurveda • Yoga • Unani • Siddha • Homeopathy
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Holistic assessment of constitutional mind-body balance (Prakriti), digestive fire (Agni), gut rhythm (Koshtha), sleep patterns (Nidra), and environmental harmony.
            </p>

            <div className="pt-2 border-t border-slate-200/70 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-teal-700" />
                <span>History Protocol: <b>Prakriti, Agni & Dosha Inquiry</b></span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>Key Clinics: Ayurvedic Kayachikitsa, Homeopathy, Panchakarma</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 text-xs font-semibold text-teal-800 flex items-center justify-between">
            <span>Traditional Indian Medicine</span>
            <span className="underline">Select AYUSH Mode &rarr;</span>
          </div>
        </div>
      </div>

      {/* OPD Department Room Mapping */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Select Designated OPD Department:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {HOSPITAL_DEPARTMENTS.filter(dept => 
            isAyush ? dept.id === 'dept_ayush' : dept.id !== 'dept_ayush'
          ).map((dept) => {
            const isSelected = selectedDepartmentId === dept.id;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => onSelectDepartment(dept.id)}
                className={`p-3 rounded-xl text-left border transition text-xs flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-950 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div>
                  <span className="block font-semibold">{dept.name}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {dept.hindiName} • Room {dept.roomNumber}
                  </span>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                )}
              </button>
            );
          })}
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
          <span>Back to Identification</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
        >
          <span>Start Conversational History Chat (इतिहास बातचीत शुरू करें)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
