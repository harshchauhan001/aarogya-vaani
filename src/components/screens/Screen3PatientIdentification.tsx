import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CreditCard,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  Building,
  History,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Patient, Language, HospitalFacility, HospitalRegistration } from '../../types';
import {
  resolvePatientForHospital,
  PatientHospitalResolutionResult,
  getAllHospitalRegistrationsForPatient,
} from '../../firebase';
import { DEFAULT_HOSPITAL, SUPPORTED_HOSPITALS } from '../../data/hospitals';

interface Screen3PatientIdentificationProps {
  patient: Patient;
  selectedLanguage: Language;
  onUpdatePatient: (updates: Partial<Patient>) => void;
  onNext: () => void;
  onBack: () => void;
  hospital?: HospitalFacility;
  onSelectHospital?: (hospital: HospitalFacility) => void;
}

export const Screen3PatientIdentification: React.FC<Screen3PatientIdentificationProps> = ({
  patient,
  selectedLanguage,
  onUpdatePatient,
  onNext,
  onBack,
  hospital,
  onSelectHospital,
}) => {
  const activeHospital = hospital || DEFAULT_HOSPITAL;
  const [authMethod, setAuthMethod] = useState<'abha' | 'aadhaar' | 'new'>('abha');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resolution result for multi-hospital UHID tracking
  const [resolutionResult, setResolutionResult] = useState<PatientHospitalResolutionResult | null>(null);
  const [patientRegistrations, setPatientRegistrations] = useState<HospitalRegistration[]>([]);

  // Form States
  const [abhaInput, setAbhaInput] = useState(patient.abhaId || '91-4582-7361-9024');
  const [aadhaarInput, setAadhaarInput] = useState('7823-9012-4567');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // New Patient Registration State
  const [formData, setFormData] = useState({
    name: patient.name || '',
    age: patient.age || 48,
    gender: patient.gender || 'Male',
    phone: patient.phone || '',
    district: patient.district || 'New Delhi',
    state: patient.state || 'Delhi',
    emergencyContact: patient.emergencyContact || '',
    abhaId: patient.abhaId || '',
  });

  // When activeHospital changes and user was already verified, re-resolve for the new hospital
  useEffect(() => {
    if (verificationSuccess && patient.abhaId) {
      handleReResolveHospital(activeHospital);
    }
  }, [activeHospital.id]);

  const handleReResolveHospital = async (targetHospital: HospitalFacility) => {
    setIsVerifying(true);
    setStatusMessage(`Switching intake facility to ${targetHospital.shortName} and checking hospital registration...`);
    try {
      const resolution = await resolvePatientForHospital(
        'abha',
        patient.abhaId,
        targetHospital,
        patient
      );
      setResolutionResult(resolution);
      setPatientRegistrations(resolution.allHospitalRegistrations);

      if (resolution.isExistingHospitalPatient) {
        setStatusMessage(
          `Welcome back to ${targetHospital.shortName}! Retrieved existing hospital UHID: ${resolution.hospitalRegistration.uhid}.`
        );
      } else {
        setStatusMessage(
          `ABHA profile (${resolution.patient.abhaId}) loaded! First visit to ${targetHospital.shortName} — generated new hospital UHID: ${resolution.hospitalRegistration.uhid}.`
        );
      }

      onUpdatePatient(resolution.patient);
    } catch (err: any) {
      console.error('Hospital switch error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Simulated OTP Sending
  const handleSendOtp = () => {
    if (authMethod === 'new') {
      if (!formData.name.trim() || !formData.phone.trim()) {
        setErrorMessage('Please enter patient Full Name and 10-digit Mobile Number.');
        return;
      }
    }
    setIsVerifying(true);
    setErrorMessage(null);
    setStatusMessage(`Connecting to ABDM / UIDAI Gateway at ${activeHospital.shortName}...`);

    setTimeout(() => {
      setIsVerifying(false);
      setOtpSent(true);
      setOtpInput('482910'); // Pre-fill mock OTP for fast testing
      setStatusMessage('OTP sent successfully to registered mobile number. Demo OTP (482910) pre-filled.');
    }, 700);
  };

  // Verify and Authenticate with Firebase behind the scenes
  const handleVerifyAndLogin = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    setStatusMessage(`Verifying credentials with ${activeHospital.shortName} & ABDM National Registry...`);

    try {
      let resolution: PatientHospitalResolutionResult;

      if (authMethod === 'abha') {
        const queryAbha = abhaInput.trim() || '91-4582-7361-9024';
        resolution = await resolvePatientForHospital(
          'abha',
          queryAbha,
          activeHospital,
          {
            name: patient.name || 'Rajesh Sharma',
            age: patient.age || 52,
            gender: patient.gender || 'Male',
            phone: patient.phone || '9876543210',
            district: patient.district || 'Central Delhi',
            state: patient.state || 'Delhi',
            tokenNumber: patient.tokenNumber || 104,
            preferredLanguage: selectedLanguage.code,
            abhaId: queryAbha,
          }
        );
      } else if (authMethod === 'aadhaar') {
        // Aadhaar e-KYC lookup
        const aadhaarPhone = '9811223344';
        resolution = await resolvePatientForHospital(
          'phone',
          aadhaarPhone,
          activeHospital,
          {
            name: 'Sunita Verma',
            age: 44,
            gender: 'Female',
            phone: aadhaarPhone,
            district: 'South Delhi',
            state: 'Delhi',
            abhaId: '91-8821-4450-1290',
            abhaAddress: 'sunita.v@abdm',
            tokenNumber: patient.tokenNumber || 104,
            preferredLanguage: selectedLanguage.code,
          }
        );
      } else {
        // New Registration Form
        if (!formData.name.trim() || !formData.phone.trim()) {
          setErrorMessage('Please enter patient full name and mobile number.');
          setIsVerifying(false);
          return;
        }

        const enteredAbha = formData.abhaId?.trim();
        resolution = await resolvePatientForHospital(
          enteredAbha ? 'abha' : 'phone',
          enteredAbha || formData.phone.trim(),
          activeHospital,
          {
            name: formData.name.trim(),
            age: Number(formData.age) || 40,
            gender: formData.gender as 'Male' | 'Female' | 'Other',
            phone: formData.phone.trim(),
            district: formData.district || 'New Delhi',
            state: formData.state || 'Delhi',
            emergencyContact: formData.emergencyContact,
            tokenNumber: patient.tokenNumber || 104,
            preferredLanguage: selectedLanguage.code,
            abhaId: enteredAbha || undefined,
          }
        );
      }

      setResolutionResult(resolution);
      setPatientRegistrations(resolution.allHospitalRegistrations);

      if (resolution.isExistingHospitalPatient) {
        setStatusMessage(
          `Welcome back to ${activeHospital.shortName}! Retrieved your existing hospital UHID: ${resolution.hospitalRegistration.uhid}. (Visit #${resolution.hospitalRegistration.visitCount})`
        );
      } else if (resolution.isExistingGlobalPatient) {
        setStatusMessage(
          `Patient verified via National ABHA (${resolution.patient.abhaId})! First visit to ${activeHospital.shortName} — generated new hospital UHID: ${resolution.hospitalRegistration.uhid}.`
        );
      } else {
        setStatusMessage(
          `New patient registered! Generated ABHA ID (${resolution.patient.abhaId}) and hospital UHID: ${resolution.hospitalRegistration.uhid} for ${activeHospital.shortName}.`
        );
      }

      onUpdatePatient(resolution.patient);
      setVerificationSuccess(true);
    } catch (err: any) {
      console.error('Identification verification error:', err);
      setErrorMessage(err?.message || 'Verification failed. Please check details or retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Step 3 of 10 • Patient Identification
              </span>
              <span className="text-xs text-slate-300">रोगी पहचान एवं पंजीकरण</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Ayushman Bharat Health Identification</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Identify using your ABHA ID entry / QR scan, Aadhaar OTP, or register as a new patient with mobile OTP.
            </p>
          </div>

          {/* Hospital Context Badge */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 sm:text-right shrink-0">
            <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold block">Fixed Kiosk Terminal Config</span>
            <span className="text-xs font-bold text-white block">{activeHospital.shortName}</span>
            <span className="text-[11px] text-emerald-300 font-mono block">hospital_id = "{activeHospital.id}"</span>
          </div>
        </div>
      </div>

      {/* ABDM Architectural Explainer Bar */}
      <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-start gap-2.5">
          <Building className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-900 block">ABDM Scoped Architecture Confirmed:</span>
            <span className="text-[11px] text-emerald-800 leading-relaxed">
              <strong>hospital_id = "DCH-001"</strong> is a fixed terminal configuration. All Firestore reads/writes for visits, sessions, and UHID lookups automatically include this hospital_id. Global patient documents carry only ABHA ID and demographics; UHID is unique per (patient, hospital) pair.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 bg-white/80 border border-emerald-300 px-2.5 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] text-slate-800 font-mono font-medium">Terminal: DCH-001</span>
        </div>
      </div>

      {/* Main Identification Mode Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        {/* Method Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            id="tab-abha-method"
            onClick={() => {
              setAuthMethod('abha');
              setVerificationSuccess(false);
              setStatusMessage(null);
            }}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition ${
              authMethod === 'abha'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <QrCode
                className={`w-6 h-6 ${authMethod === 'abha' ? 'text-emerald-700' : 'text-slate-500'}`}
              />
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                Recommended
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">ABHA ID / Scan</div>
              <div className="text-xs text-slate-500">14-Digit Health ID or QR</div>
            </div>
          </button>

          <button
            type="button"
            id="tab-aadhaar-method"
            onClick={() => {
              setAuthMethod('aadhaar');
              setVerificationSuccess(false);
              setStatusMessage(null);
            }}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition ${
              authMethod === 'aadhaar'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <CreditCard
              className={`w-6 h-6 ${authMethod === 'aadhaar' ? 'text-emerald-700' : 'text-slate-500'}`}
            />
            <div>
              <div className="font-bold text-sm text-slate-900">Aadhaar e-KYC</div>
              <div className="text-xs text-slate-500">12-Digit UID + OTP</div>
            </div>
          </button>

          <button
            type="button"
            id="tab-new-method"
            onClick={() => {
              setAuthMethod('new');
              setVerificationSuccess(false);
              setStatusMessage(null);
            }}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition ${
              authMethod === 'new'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <UserPlus
              className={`w-6 h-6 ${authMethod === 'new' ? 'text-emerald-700' : 'text-slate-500'}`}
            />
            <div>
              <div className="font-bold text-sm text-slate-900">New Registration</div>
              <div className="text-xs text-slate-500">Demographics + Mobile OTP</div>
            </div>
          </button>
        </div>

        {/* METHOD 1: ABHA Entry */}
        {authMethod === 'abha' && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ABHA Number (14 Digits) or ABHA Address (@abdm)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={abhaInput}
                  onChange={(e) => setAbhaInput(e.target.value)}
                  placeholder="e.g. 91-4582-7361-9024 or patient@abdm"
                  className="w-full px-4 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setAbhaInput('91-4582-7361-9024')}
                  className="absolute right-2 top-2 px-2.5 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
                >
                  Fill Demo ABHA
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Demo record: <code className="font-mono text-emerald-800">91-4582-7361-9024</code> (Rajesh Sharma)
              </p>
            </div>
          </div>
        )}

        {/* METHOD 2: Aadhaar Entry */}
        {authMethod === 'aadhaar' && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full px-4 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Consent will be logged as per UIDAI & DISHA guidelines. Demo record: Sunita Verma.
              </p>
            </div>
          </div>
        )}

        {/* METHOD 3: New Patient Form */}
        {authMethod === 'new' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (मोबाइल नंबर) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ABHA ID (आभा आईडी) — Optional / यदि पहले से हो
                </label>
                <input
                  type="text"
                  value={formData.abhaId}
                  onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                  placeholder="e.g. 91-4582-7361-9024 or patient@abdm"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter existing ABHA to automatically restore your hospital UHID and increment your visit count.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age (उम्र)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender (लिंग)</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Male">Male (पुरुष)</option>
                  <option value="Female">Female (महिला)</option>
                  <option value="Other">Other (अन्य)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District / State
                </label>
                <input
                  type="text"
                  value={`${formData.district}, ${formData.state}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(',');
                    setFormData({
                      ...formData,
                      district: parts[0]?.trim() || '',
                      state: parts[1]?.trim() || '',
                    });
                  }}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact (Optional)
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Relation & Phone"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* OTP Input Section (shown when OTP is sent) */}
        {otpSent && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Smartphone className="w-4 h-4 text-amber-700" />
              <span>Enter 6-Digit OTP received on registered mobile</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="482910"
                maxLength={6}
                className="w-48 px-4 py-2 font-mono text-center text-base tracking-widest border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-bold"
              />
              <button
                type="button"
                onClick={handleVerifyAndLogin}
                disabled={isVerifying || !otpInput}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Verify</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Initial Trigger Button (if OTP not sent yet) */}
        {!otpSent && !verificationSuccess && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isVerifying}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>{authMethod === 'new' ? 'Send OTP to Mobile' : 'Verify via OTP'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Status / Error Messages */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Verified Card with Hospital-Scoped UHID & Cross-Hospital Records */}
        {verificationSuccess && (
          <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Identification Confirmed (पहचान सत्यापित)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[11px] font-mono rounded-full font-bold">
                  TOKEN #{patient.tokenNumber || 104}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] rounded font-semibold">
                  {activeHospital.shortName}
                </span>
              </div>
            </div>

            {/* Demographics & IDs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border border-emerald-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name:</span>
                <span className="font-bold text-slate-900">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Age / Gender:</span>
                <span className="font-semibold text-slate-900">
                  {patient.age} Y / {patient.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold text-emerald-800">
                  National ABHA ID (Global):
                </span>
                <span className="font-mono font-bold text-emerald-700">{patient.abhaId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold text-slate-700">
                  Hospital UHID ({activeHospital.code}):
                </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {patient.uhid}
                </span>
              </div>
            </div>

            {/* Cross-Hospital Registry Breakdown (Proving Hospital-Scoped UHID) */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Cross-Hospital Registrations Linked to ABHA: {patient.abhaId}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {patientRegistrations.length} Hospital {patientRegistrations.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {patientRegistrations.map((reg) => {
                  const isCurrent = reg.hospitalId === activeHospital.id;
                  return (
                    <div
                      key={reg.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-emerald-50/80 border-emerald-300 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building className={`w-3.5 h-3.5 ${isCurrent ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-bold text-slate-900">{reg.hospitalName}</div>
                          <div className="text-[10px] text-slate-500">
                            First visited: {new Date(reg.firstVisitAt).toLocaleDateString('en-IN')} • Total visits: {reg.visitCount}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">{reg.uhid}</div>
                        <div className="text-[10px]">
                          {isCurrent ? (
                            <span className="text-emerald-700 font-semibold">Active Session UHID</span>
                          ) : (
                            <span className="text-slate-400">Hospital-Scoped UHID</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                Notice: The ABHA ID ({patient.abhaId}) stays constant across every hospital, while each hospital maintains its own unique UHID.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Consent</span>
        </button>

        <button
          type="button"
          disabled={!verificationSuccess}
          onClick={onNext}
          className={`px-7 py-3 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition ${
            verificationSuccess
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20 cursor-pointer'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Proceed to Consultation Mode (आगे बढ़ें)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
