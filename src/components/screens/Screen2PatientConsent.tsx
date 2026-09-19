import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Mic,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  Lock,
  HeartHandshake,
} from 'lucide-react';
import { Language } from '../../types';
import { CURRENT_HOSPITAL } from '../../data/hospitals';

interface Screen2PatientConsentProps {
  selectedLanguage: Language;
  onNext: () => void;
  onBack: () => void;
}

export const Screen2PatientConsent: React.FC<Screen2PatientConsentProps> = ({
  selectedLanguage,
  onNext,
  onBack,
}) => {
  const [agreedAbha, setAgreedAbha] = useState(true);
  const [agreedAudio, setAgreedAudio] = useState(true);
  const [agreedDoctorShare, setAgreedDoctorShare] = useState(true);

  const canProceed = agreedAbha && agreedAudio && agreedDoctorShare;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Step 2 of 10 • Patient Informed Consent
              </span>
              <span className="text-xs text-slate-300">रोगी सहमति प्रपत्र</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Digital Health Consent & Privacy Notice</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Under Ayushman Bharat Digital Mission (ABDM) guidelines, your data privacy and informed consent are strictly protected.
            </p>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center self-start sm:self-center shrink-0 border border-white/10">
            <Lock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-white block">DISHA Compliant</span>
            <span className="text-[10px] text-slate-300">AES-256 Encrypted</span>
          </div>
        </div>
      </div>

      {/* Consent Clauses */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Please review and provide your affirmative consent:</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            कृप्या नीचे दिए गए नियमों को पढ़कर अपनी सहमति प्रदान करें।
          </p>
        </div>

        {/* Clause 1: ABHA Data Sharing */}
        <div
          onClick={() => setAgreedAbha(!agreedAbha)}
          className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
            agreedAbha
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <button
            type="button"
            className="mt-0.5 text-emerald-700 focus:outline-none"
            aria-label="Toggle ABHA consent"
          >
            {agreedAbha ? (
              <CheckSquare className="w-5 h-5 text-emerald-700" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-900">
                1. ABHA Digital Health Record Linking (आयुष्मान भारत डिजिटल मिशन)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              I consent to retrieve and link my existing medical records with my Ayushman Bharat Health Account (ABHA ID) for continuity of care at {CURRENT_HOSPITAL.name} OPD.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              मैं अपनी चिकित्सा जानकारी को अपने आभा (ABHA) खाते से जोड़ने की अनुमति देता/देती हूँ।
            </p>
          </div>
        </div>

        {/* Clause 2: Voice & History Taking */}
        <div
          onClick={() => setAgreedAudio(!agreedAudio)}
          className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
            agreedAudio
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <button
            type="button"
            className="mt-0.5 text-emerald-700 focus:outline-none"
            aria-label="Toggle voice consent"
          >
            {agreedAudio ? (
              <CheckSquare className="w-5 h-5 text-emerald-700" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-900">
                2. Voice-Assisted Intake & Natural History Taking (आवाज आधारित बातचीत)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              I agree to speak into the kiosk microphone to answer clinical history questions in my selected language ({selectedLanguage.name}). My voice audio will only be used to generate my OPD history summary.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              मैं लक्षणों को बताने के लिए अपनी आवाज रिकॉर्ड करने की अनुमति देता/देती हूँ।
            </p>
          </div>
        </div>

        {/* Clause 3: Doctor Consultation Note */}
        <div
          onClick={() => setAgreedDoctorShare(!agreedDoctorShare)}
          className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
            agreedDoctorShare
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <button
            type="button"
            className="mt-0.5 text-emerald-700 focus:outline-none"
            aria-label="Toggle doctor share consent"
          >
            {agreedDoctorShare ? (
              <CheckSquare className="w-5 h-5 text-emerald-700" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-900">
                3. Transmission to Treating Doctor (डॉक्टर को पूर्व-इतिहास प्रेषण)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              I authorize this kiosk to transmit my symptom summary directly to the assigned OPD physician's workstation before my turn.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              मेरा लक्षण सारांश मेरे परामर्श कक्ष के डॉक्टर को भेजा जाएगा।
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Language</span>
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className={`px-7 py-3 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition ${
            canProceed
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20 cursor-pointer'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>I Agree & Proceed to Identification (सहमति है)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
