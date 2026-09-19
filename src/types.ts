export enum ScreenId {
  WELCOME_LANGUAGE = '1_WELCOME_LANGUAGE',
  PATIENT_CONSENT = '2_PATIENT_CONSENT',
  PATIENT_IDENTIFICATION = '3_PATIENT_IDENTIFICATION',
  CONSULTATION_MODE = '4_CONSULTATION_MODE',
  CONVERSATIONAL_CHAT = '5_CONVERSATIONAL_CHAT',
  RED_FLAG_ALERT = '6_RED_FLAG_ALERT',
  DOCUMENT_SCAN = '7_DOCUMENT_SCAN',
  PATIENT_SUMMARY = '8_PATIENT_SUMMARY',
  PHYSICIAN_DASHBOARD = '9_PHYSICIAN_DASHBOARD',
  PATIENT_DASHBOARD = '10_PATIENT_DASHBOARD',
  ACCESSIBILITY_SETTINGS = '11_ACCESSIBILITY_SETTINGS',
  STAFF_ALERT_QUEUE = '12_STAFF_ALERT_QUEUE',
  SESSION_COMPLETE = '13_SESSION_COMPLETE',
}

export type ConsultationMode = 'GENERAL' | 'AYUSH';

export interface ScannedDocument {
  id: string;
  name: string;
  type: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Other';
  uploadedAt: string;
  extractedText: string;
  keyFindings: string[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  greeting: string;
  samplePhrase: string;
}

export interface Department {
  id: string;
  name: string;
  hindiName: string;
  roomNumber: string;
  doctorName: string;
  doctorDegree: string;
  iconName: string;
  commonComplaints: string[];
}

export interface HospitalFacility {
  id: string;
  code: string;
  name: string;
  hindiName: string;
  shortName: string;
  city: string;
  state: string;
  uhidPrefix: string;
  departmentsCount: number;
  kioskIdentifier: string; // e.g. 'Kiosk #04 - OPD Ground Floor'
  location: string; // e.g. 'OPD Block, Ground Floor'
}

export interface HospitalRegistration {
  id: string; // `${patientId}_${hospitalId}`
  patientId: string;
  abhaId?: string;
  hospitalId: string;
  hospital_id?: string;
  hospitalName: string;
  uhid: string;
  firstVisitAt: string;
  lastVisitAt: string;
  visitCount: number;
  tokenNumber?: number;
  departmentId?: string;
  registeredAt?: string;
}

export interface Patient {
  id: string;
  tokenNumber: number;
  abhaId: string; // Constant across all hospitals
  abhaAddress: string;
  uhid: string; // Active hospital-scoped UHID for current session (stored only in hospital registration in Firestore)
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  district: string;
  state: string;
  emergencyContact?: string;
  registeredAt?: string;
  mode: 'kiosk' | 'mobile' | 'asha';
  preferredLanguage?: string;
  hospitalRegistrations?: Record<string, HospitalRegistration>;
  activeHospitalId?: string;
  activeHospitalName?: string;
}

export interface Vitals {
  bpSystolic: number;
  bpDiastolic: number;
  pulseRate: number;
  spo2: number;
  temperature: number;
  respiratoryRate: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
}

export interface HistoryOfPresentIllness {
  chiefComplaint: string;
  bodySite: string;
  onset: 'Sudden' | 'Gradual' | 'Recurring';
  durationNumber: number;
  durationUnit: 'Hours' | 'Days' | 'Weeks' | 'Months';
  severity: number; // 1 to 10
  character: string;
  radiation: string;
  aggravatingFactors: string[];
  relievingFactors: string[];
  progress: 'Worsening' | 'Stable' | 'Fluctuating' | 'Improving';
  vernacularVoiceTranscript: string;
}

export interface ClinicalHistory {
  hpi: HistoryOfPresentIllness;
  associatedSymptoms: string[];
  pastMedicalHistory: string[];
  currentMedications: string[];
  drugAllergies: string[];
  foodAllergies: string[];
  socialHabits: {
    tobaccoOrBidi: boolean;
    gutkhaOrKhaini: boolean;
    alcohol: boolean;
    packYears?: string;
    occupationalExposure?: string;
  };
  familyHistory: string[];
  recentSurgeriesOrHospitalizations: string;
  ayushAssessment?: {
    prakritiVikriti?: string;
    agniKoshtha?: string;
    nidraManas?: string;
    balaAmaSweda?: string;
    rituAharaTriggers?: string;
    priorAyushLifestyle?: string;
  };
}

export const INITIAL_EMPTY_CLINICAL_HISTORY: ClinicalHistory = {
  hpi: {
    chiefComplaint: '',
    bodySite: '',
    onset: 'Gradual',
    durationNumber: 0,
    durationUnit: 'Days',
    severity: 0,
    character: '',
    radiation: '',
    aggravatingFactors: [],
    relievingFactors: [],
    progress: 'Stable',
    vernacularVoiceTranscript: '',
  },
  associatedSymptoms: [],
  pastMedicalHistory: [],
  currentMedications: [],
  drugAllergies: [],
  foodAllergies: [],
  socialHabits: {
    tobaccoOrBidi: false,
    gutkhaOrKhaini: false,
    alcohol: false,
  },
  familyHistory: [],
  recentSurgeriesOrHospitalizations: '',
};

export interface QuestionBankDomain {
  id: string;
  nameEn: string;
  nameHi: string;
  code: string;
  description: string;
  coreQuestionsEn: string[];
  coreQuestionsHi: string[];
  sampleResponsesHi: string[];
  sampleResponsesEn: string[];
}

export type TriageLevel = 'RED' | 'YELLOW' | 'GREEN';

export interface TriageAssessment {
  level: TriageLevel;
  redFlagsDetected: string[];
  urgencyRationale: string;
  recommendedDestination: string;
  priorityScore?: number;
  recommendedTriageCode?: string;
}

export const INITIAL_EMPTY_TRIAGE: TriageAssessment = {
  level: 'GREEN',
  urgencyRationale: 'Awaiting clinical evaluation.',
  redFlagsDetected: [],
  recommendedDestination: 'General OPD Waiting Area',
  priorityScore: 0,
  recommendedTriageCode: 'TRIAGE-GREEN-STANDARD',
};

export interface PrescriptionItem {
  id: string;
  genericName: string;
  medicineName?: string;
  brandEquivalent?: string;
  dosage: string;
  frequency: '1-0-1' | '1-0-0' | '0-0-1' | '0-1-0' | '1-1-1' | 'SOS' | 'Once weekly' | string;
  relationToFood?: 'Before Food (खाली पेट)' | 'After Food (भोजन के बाद)' | 'With Food' | 'Anytime' | string;
  timing?: string;
  durationDays?: number;
  duration?: string;
  isJanAushadhi: boolean;
  brandPriceInr?: number;
  brandedPrice?: number;
  janAushadhiPriceInr?: number;
  janAushadhiPrice?: number;
  instructions?: string;
  instructionsVernacular?: string;
}

export interface SoapNote {
  id?: string;
  encounterId?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Codes: { code: string; name: string }[];
  differentialDiagnoses?: { condition: string; probability: string }[];
  investigations?: string[];
  prescriptions?: PrescriptionItem[];
  followUpDays?: number;
  doctorNotes?: string;
  patientVernacularSummary?: string;
  generatedAt?: string;
  isFinalized?: boolean;
}

export interface OPDEncounter {
  id: string;
  tokenNumber: number;
  hospitalId: string; // Fixed kiosk hospital ID (e.g. 'DCH-001')
  hospital_id?: string; // ABDM alias
  hospitalName?: string;
  patient: Patient;
  departmentId: string;
  departmentName?: string;
  roomNumber?: string;
  doctorName?: string;
  vitals: Vitals;
  history: ClinicalHistory;
  triage: TriageAssessment;
  soapNote?: SoapNote;
  prescription?: {
    id: string;
    encounterId: string;
    items: PrescriptionItem[];
    totalBrandedCost: number;
    totalJanAushadhiCost: number;
    savings: number;
    doctorSignatureNMC: string;
    issuedAt: string;
  };
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'EMERGENCY_REFERRED' | 'TRIAGED_RED';
  calledAt?: string;
  completedAt?: string;
  createdAt?: string;
  tokenGeneratedAt?: string;
}

export interface ClinicalQuestionNode {
  id: string;
  questionEn: string;
  questionHi: string;
  type: 'single-choice' | 'multi-choice' | 'scale' | 'text' | 'voice';
  options?: { labelEn: string; labelHi: string; isRedFlag?: boolean }[];
  category: 'onset' | 'character' | 'severity' | 'associated' | 'past' | 'meds' | 'allergies';
  subText?: string;
}
