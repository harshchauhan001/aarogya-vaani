/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ScreenId,
  Patient,
  ClinicalHistory,
  Vitals,
  TriageAssessment,
  OPDEncounter,
  Language,
  ConsultationMode,
  ScannedDocument,
  HospitalFacility,
  INITIAL_EMPTY_CLINICAL_HISTORY,
  INITIAL_EMPTY_TRIAGE,
} from './types';
import {
  SUPPORTED_LANGUAGES,
  HOSPITAL_DEPARTMENTS,
  INITIAL_OPD_ENCOUNTERS,
} from './data/mockClinicalData';
import { DEFAULT_HOSPITAL, generateHospitalUHID } from './data/hospitals';
import { Header } from './components/Header';
import { ScreenNavigation, ORDERED_STEPS } from './components/ScreenNavigation';
import { LanguageModal } from './components/LanguageModal';
import { Screen1WelcomeLanguage } from './components/screens/Screen1WelcomeLanguage';
import { Screen2PatientConsent } from './components/screens/Screen2PatientConsent';
import { Screen3PatientIdentification } from './components/screens/Screen3PatientIdentification';
import { Screen4ConsultationMode } from './components/screens/Screen4ConsultationMode';
import { Screen5ConversationalChat } from './components/screens/Screen5ConversationalChat';
import { Screen6RedFlagAlert } from './components/screens/Screen6RedFlagAlert';
import { Screen7DocumentScan } from './components/screens/Screen7DocumentScan';
import { Screen8PatientSummary } from './components/screens/Screen8PatientSummary';
import { Screen9PhysicianDashboard } from './components/screens/Screen9PhysicianDashboard';
import { Screen10PatientDashboard } from './components/screens/Screen10PatientDashboard';
import { Screen11AccessibilitySettings } from './components/screens/Screen11AccessibilitySettings';
import { Screen12StaffAlertQueue } from './components/screens/Screen12StaffAlertQueue';
import { Screen13SessionComplete } from './components/screens/Screen13SessionComplete';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import { playHospitalDingDong, speakText } from './utils/audioUtils';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(ScreenId.WELCOME_LANGUAGE);
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);
  const [staffAuthenticated, setStaffAuthenticated] = useState<boolean>(false);

  // Selected Indian Language (default: Hindi)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);

  // Active Hospital Facility (ABDM multi-hospital support)
  const [currentHospital, setCurrentHospital] = useState<HospitalFacility>(DEFAULT_HOSPITAL);

  // Consultation Mode (General Allopathy vs AYUSH)
  const [consultationMode, setConsultationMode] = useState<ConsultationMode>('GENERAL');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('dept_medicine');

  // Active Patient Demographics
  const [patient, setPatient] = useState<Patient>({
    id: 'pt-default-104',
    name: 'Rajesh Sharma',
    age: 52,
    gender: 'Male',
    phone: '9876543210',
    district: 'Central Delhi',
    state: 'Delhi',
    abhaId: '91-4582-7361-9024',
    abhaAddress: 'rajesh.sharma@abdm',
    uhid: 'DCH-2026-784912',
    tokenNumber: 104,
    mode: 'kiosk',
    preferredLanguage: 'hi',
    activeHospitalId: DEFAULT_HOSPITAL.id,
    activeHospitalName: DEFAULT_HOSPITAL.name,
  });

  // Active Kiosk Session ID (freshly generated for every session)
  const [sessionId, setSessionId] = useState<string>(
    () => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Clinical History (starts completely empty, populated turn-by-turn by Gemini)
  const [history, setHistory] = useState<ClinicalHistory>(INITIAL_EMPTY_CLINICAL_HISTORY);

  // Physical Vitals
  const [vitals, setVitals] = useState<Vitals>({
    bpSystolic: 120,
    bpDiastolic: 80,
    pulseRate: 72,
    temperature: 98.6,
    spo2: 98,
    respiratoryRate: 16,
    weightKg: 65,
    heightCm: 165,
    bmi: 23.9,
  });

  // Triage Assessment (defaults to standard Green until clinical facts/vitals are captured)
  const [triage, setTriage] = useState<TriageAssessment>(INITIAL_EMPTY_TRIAGE);

  // Scanned Prior Medical Documents
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([]);

  // Universal Accessibility state (accessible at any time on every screen)
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [contrastMode, setContrastMode] = useState<'default' | 'high-contrast' | 'yellow-black'>('default');
  const [voiceAssistance, setVoiceAssistance] = useState<boolean>(true);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState<boolean>(false);

  const handleCycleTextSize = () => {
    setTextSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const handleCycleContrast = () => {
    setContrastMode((prev) => {
      if (prev === 'default') return 'high-contrast';
      if (prev === 'high-contrast') return 'yellow-black';
      return 'default';
    });
  };

  // Navigation transition helper with strict linear unlocking
  const advanceToStep = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= ORDERED_STEPS.length) return;
    const targetScreen = ORDERED_STEPS[targetIndex].id;
    setMaxUnlockedIndex((prev) => Math.max(prev, targetIndex));
    setCurrentScreen(targetScreen);

    if (soundEnabled && targetIndex === 7) {
      playHospitalDingDong();
      speakText(`Token number ${patient.tokenNumber} confirmed.`, 'en');
    }
  };

  const stepBack = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < ORDERED_STEPS.length) {
      setCurrentScreen(ORDERED_STEPS[targetIndex].id);
    }
  };

  // Active OPD Encounter constructed from state
  const activeEncounter: OPDEncounter = {
    id: `enc-${patient.id}`,
    hospitalId: currentHospital.id,
    hospital_id: currentHospital.id,
    hospitalName: currentHospital.name,
    patient,
    tokenNumber: patient.tokenNumber,
    departmentId: selectedDepartmentId,
    doctorName:
      HOSPITAL_DEPARTMENTS.find((d) => d.id === selectedDepartmentId)?.doctorName ||
      'Dr. A. Sharma, MD',
    createdAt: new Date().toISOString(),
    status: triage.level === 'RED' ? 'TRIAGED_RED' : 'WAITING',
    vitals,
    history,
    triage,
  };

  // Reset session for next patient
  const handleResetSession = () => {
    setCurrentScreen(ScreenId.WELCOME_LANGUAGE);
    setMaxUnlockedIndex(0);
    setScannedDocs([]);
    setStaffAuthenticated(false);
    setSessionId(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    setHistory(INITIAL_EMPTY_CLINICAL_HISTORY);
    setTriage(INITIAL_EMPTY_TRIAGE);
    setPatient({
      id: `pt-${Date.now()}`,
      name: '',
      age: 45,
      gender: 'Male',
      phone: '',
      district: 'New Delhi',
      state: 'Delhi',
      abhaId: '',
      abhaAddress: '',
      uhid: generateHospitalUHID(currentHospital),
      tokenNumber: patient.tokenNumber + 1,
      mode: 'kiosk',
      preferredLanguage: selectedLanguage.code,
    });
  };

  return (
    <FirebaseAuthProvider>
      <div
        className={`min-h-screen flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${
          contrastMode === 'yellow-black'
            ? 'bg-black text-amber-300'
            : contrastMode === 'high-contrast'
            ? 'bg-slate-950 text-white'
            : 'bg-slate-100 text-slate-900'
        } ${textSize === 'xlarge' ? 'text-lg' : textSize === 'large' ? 'text-base' : ''}`}
      >
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          selectedLanguage={selectedLanguage.code}
          onOpenLanguageModal={() => setShowLangModal(true)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          staffAuthenticated={staffAuthenticated}
          onOpenStaffPortal={() => setCurrentScreen(ScreenId.PHYSICIAN_DASHBOARD)}
          hospital={currentHospital}
          onSelectHospital={(h) => {
            setCurrentHospital(h);
            setPatient((p) => ({
              ...p,
              activeHospitalId: h.id,
              activeHospitalName: h.name,
            }));
          }}
          activeEncountersCount={{
            total: INITIAL_OPD_ENCOUNTERS.length + 1,
            red: triage.level === 'RED' ? 2 : 1,
            yellow: 3,
            green: 8,
          }}
          onOpenAccessibilityModal={() => setShowAccessibilityModal(true)}
          textSize={textSize}
          onCycleTextSize={handleCycleTextSize}
          contrastMode={contrastMode}
          onCycleContrast={handleCycleContrast}
        />

        {/* Linear Step Progression Navigation */}
        <ScreenNavigation
          currentScreen={currentScreen}
          maxUnlockedIndex={maxUnlockedIndex}
          staffAuthenticated={staffAuthenticated}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onExitStaffMode={() => {
            setStaffAuthenticated(false);
            setCurrentScreen(ScreenId.WELCOME_LANGUAGE);
          }}
        />

        {/* Main Intake / Staff Body */}
        <main className="flex-1 pb-8">
          {/* SCREEN 1: Welcome & Language Select */}
          {currentScreen === ScreenId.WELCOME_LANGUAGE && (
            <Screen1WelcomeLanguage
              selectedLanguage={selectedLanguage}
              onSelectLanguage={(lang) => {
                setSelectedLanguage(lang);
                setPatient((p) => ({ ...p, preferredLanguage: lang.code }));
              }}
              onNext={() => advanceToStep(1)}
            />
          )}

          {/* SCREEN 2: Patient Consent */}
          {currentScreen === ScreenId.PATIENT_CONSENT && (
            <Screen2PatientConsent
              selectedLanguage={selectedLanguage}
              onNext={() => advanceToStep(2)}
              onBack={() => stepBack(0)}
            />
          )}

          {/* SCREEN 3: Patient Identification (ABHA / Aadhaar / New Registration) */}
          {currentScreen === ScreenId.PATIENT_IDENTIFICATION && (
            <Screen3PatientIdentification
              patient={patient}
              selectedLanguage={selectedLanguage}
              hospital={currentHospital}
              onSelectHospital={(h) => {
                setCurrentHospital(h);
                setPatient((p) => ({
                  ...p,
                  activeHospitalId: h.id,
                  activeHospitalName: h.name,
                }));
              }}
              onUpdatePatient={(updates) => {
                setPatient((p) => ({ ...p, ...updates }));
                // Ensure fresh session and empty history when patient is identified / changed
                setHistory(INITIAL_EMPTY_CLINICAL_HISTORY);
                setTriage(INITIAL_EMPTY_TRIAGE);
                setSessionId(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
              }}
              onNext={() => advanceToStep(3)}
              onBack={() => stepBack(1)}
            />
          )}

          {/* SCREEN 4: Consultation Mode Select (General vs AYUSH) */}
          {currentScreen === ScreenId.CONSULTATION_MODE && (
            <Screen4ConsultationMode
              consultationMode={consultationMode}
              selectedDepartmentId={selectedDepartmentId}
              onSelectMode={(mode) => setConsultationMode(mode)}
              onSelectDepartment={(deptId) => setSelectedDepartmentId(deptId)}
              onNext={() => advanceToStep(4)}
              onBack={() => stepBack(2)}
            />
          )}

          {/* SCREEN 5: Conversational History Chat */}
          {currentScreen === ScreenId.CONVERSATIONAL_CHAT && (
            <Screen5ConversationalChat
              patient={patient}
              selectedLanguage={selectedLanguage}
              consultationMode={consultationMode}
              departmentId={selectedDepartmentId}
              history={history}
              triage={triage}
              sessionId={sessionId}
              onUpdateHistory={(updates) => setHistory((h) => ({ ...h, ...updates }))}
              onUpdateTriage={(updates) => setTriage((t) => ({ ...t, ...updates }))}
              onSelectConsultationMode={(mode) => setConsultationMode(mode)}
              onNext={() => advanceToStep(5)}
              onBack={() => stepBack(3)}
            />
          )}

          {/* SCREEN 6: Red-Flag Emergency Alert (patient-facing, calm tone) */}
          {currentScreen === ScreenId.RED_FLAG_ALERT && (
            <Screen6RedFlagAlert
              patient={patient}
              triage={triage}
              vitals={vitals}
              onUpdateTriage={(updates) => setTriage((t) => ({ ...t, ...updates }))}
              onNext={() => advanceToStep(6)}
              onBack={() => stepBack(4)}
            />
          )}

          {/* SCREEN 7: Document Scan & OCR */}
          {currentScreen === ScreenId.DOCUMENT_SCAN && (
            <Screen7DocumentScan
              scannedDocs={scannedDocs}
              onAddDocument={(doc) => setScannedDocs((prev) => [...prev, doc])}
              onRemoveDocument={(id) => setScannedDocs((prev) => prev.filter((d) => d.id !== id))}
              onNext={() => advanceToStep(7)}
              onBack={() => stepBack(5)}
            />
          )}

          {/* SCREEN 8: Patient Summary Confirmation & Slip */}
          {currentScreen === ScreenId.PATIENT_SUMMARY && (
            <Screen8PatientSummary
              encounter={activeEncounter}
              scannedDocs={scannedDocs}
              onNext={() => advanceToStep(8)}
              onBack={() => stepBack(6)}
            />
          )}

          {/* SCREEN 9: Physician Clinical Dashboard (Staff Protected - Not on Patient Tabs) */}
          {currentScreen === ScreenId.PHYSICIAN_DASHBOARD && (
            <Screen9PhysicianDashboard
              encounter={activeEncounter}
              scannedDocs={scannedDocs}
              staffAuthenticated={staffAuthenticated}
              onAuthenticateStaff={setStaffAuthenticated}
              onUpdateEncounterStatus={(status) => console.log('Encounter status updated:', status)}
              onNext={() => setCurrentScreen(ScreenId.STAFF_ALERT_QUEUE)}
              onBack={() => {
                setStaffAuthenticated(false);
                setCurrentScreen(ScreenId.WELCOME_LANGUAGE);
              }}
            />
          )}

          {/* SCREEN 10: Patient Personal Dashboard / Live Queue Status */}
          {currentScreen === ScreenId.PATIENT_DASHBOARD && (
            <Screen10PatientDashboard
              encounter={activeEncounter}
              onNext={() => advanceToStep(9)}
              onBack={() => stepBack(7)}
            />
          )}

          {/* SCREEN 11: Accessibility Settings (Full screen view fallback) */}
          {currentScreen === ScreenId.ACCESSIBILITY_SETTINGS && (
            <Screen11AccessibilitySettings
              selectedLanguage={selectedLanguage}
              onSelectLanguage={(lang) => {
                setSelectedLanguage(lang);
                setPatient((p) => ({ ...p, preferredLanguage: lang.code }));
              }}
              textSize={textSize}
              onTextSizeChange={setTextSize}
              contrastMode={contrastMode}
              onContrastModeChange={setContrastMode}
              voiceAssistance={voiceAssistance}
              onVoiceAssistanceChange={setVoiceAssistance}
              onClose={() => setCurrentScreen(ScreenId.PATIENT_DASHBOARD)}
              onBack={() => setCurrentScreen(ScreenId.PATIENT_DASHBOARD)}
              onNext={() => setCurrentScreen(ScreenId.SESSION_COMPLETE)}
            />
          )}

          {/* SCREEN 12: Staff Alert Queue (Staff Protected - Not on Patient Tabs) */}
          {currentScreen === ScreenId.STAFF_ALERT_QUEUE && (
            <Screen12StaffAlertQueue
              encounter={activeEncounter}
              staffAuthenticated={staffAuthenticated}
              onAuthenticateStaff={setStaffAuthenticated}
              onNext={() => setCurrentScreen(ScreenId.PHYSICIAN_DASHBOARD)}
              onBack={() => {
                setStaffAuthenticated(false);
                setCurrentScreen(ScreenId.WELCOME_LANGUAGE);
              }}
            />
          )}

          {/* SCREEN 13: Session Complete / Thank You */}
          {currentScreen === ScreenId.SESSION_COMPLETE && (
            <Screen13SessionComplete
              encounter={activeEncounter}
              selectedLanguage={selectedLanguage}
              soundEnabled={soundEnabled}
              onResetSession={handleResetSession}
              onViewSummarySlip={() => setCurrentScreen(ScreenId.PATIENT_SUMMARY)}
            />
          )}
        </main>

        {/* Global Accessibility Settings Modal - accessible anytime via header */}
        {showAccessibilityModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 sm:p-4">
                <Screen11AccessibilitySettings
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={(lang) => {
                    setSelectedLanguage(lang);
                    setPatient((p) => ({ ...p, preferredLanguage: lang.code }));
                  }}
                  textSize={textSize}
                  onTextSizeChange={setTextSize}
                  contrastMode={contrastMode}
                  onContrastModeChange={setContrastMode}
                  voiceAssistance={voiceAssistance}
                  onVoiceAssistanceChange={setVoiceAssistance}
                  onClose={() => setShowAccessibilityModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Language Modal */}
        <LanguageModal
          isOpen={showLangModal}
          onClose={() => setShowLangModal(false)}
          selectedLanguage={selectedLanguage.code}
          onSelectLanguage={(code) => {
            const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
            if (found) {
              setSelectedLanguage(found);
              setPatient((p) => ({ ...p, preferredLanguage: found.code }));
            }
          }}
        />
      </div>
    </FirebaseAuthProvider>
  );
}
