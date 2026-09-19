import { HospitalFacility } from '../types';

/**
 * FIXED KIOSK / APP-LEVEL CONFIGURATION VALUE
 *
 * In production ABDM kiosk architectures, `hospital_id` is a fixed terminal/app
 * configuration value injected at the kiosk/edge deployment level (e.g. via kiosk
 * provisioning config, MDM, or environment). It is strictly NOT derived from any
 * patient input.
 *
 * For this prototype, hospital_id is hardcoded to "DCH-001" (District Civil Hospital).
 * Every Firestore read/write for patient visits, sessions, encounters, and UHID
 * lookups automatically includes this hospital_id.
 */
export const KIOSK_HOSPITAL_ID = 'DCH-001';
export const KIOSK_HOSPITAL_NAME = 'District Civil Hospital';
export const KIOSK_LOCATION_IDENTIFIER = 'Kiosk #04 - OPD Ground Floor';

export const DISTRICT_CIVIL_HOSPITAL: HospitalFacility = {
  id: KIOSK_HOSPITAL_ID,
  code: 'DCH',
  name: KIOSK_HOSPITAL_NAME,
  hindiName: 'जिला नागरिक चिकित्सालय (District Civil Hospital)',
  shortName: 'District Civil Hospital',
  kioskIdentifier: KIOSK_LOCATION_IDENTIFIER,
  location: 'OPD Ground Floor',
  city: 'Central District',
  state: 'Delhi',
  uhidPrefix: 'DCH',
  departmentsCount: 8,
};

// Fixed single demo hospital for this kiosk terminal
export const DEFAULT_HOSPITAL: HospitalFacility = DISTRICT_CIVIL_HOSPITAL;
export const CURRENT_HOSPITAL: HospitalFacility = DISTRICT_CIVIL_HOSPITAL;

export const SUPPORTED_HOSPITALS: HospitalFacility[] = [
  DISTRICT_CIVIL_HOSPITAL,
];

/**
 * Generates a hospital-scoped UHID using the fixed hospital configuration prefix.
 * e.g., DCH-2026-784912
 */
export function generateHospitalUHID(hospital: HospitalFacility = CURRENT_HOSPITAL): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${hospital.uhidPrefix}-${randomNum}`;
}
