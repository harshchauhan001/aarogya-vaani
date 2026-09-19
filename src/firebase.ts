import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  getDocFromServer,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { HospitalFacility, HospitalRegistration, Patient, OPDEncounter } from './types';
import {
  KIOSK_HOSPITAL_ID,
  CURRENT_HOSPITAL,
  DEFAULT_HOSPITAL,
  generateHospitalUHID,
} from './data/hospitals';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID as required
export const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Test connection on startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    return false;
  }
}

// Ensure an authenticated session exists behind the scenes without user login friction
export async function ensureAuthSession(): Promise<FirebaseUser | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth initialization:', err);
    return null;
  }
}

/**
 * ============================================================================
 * ABDM HOSPITAL-SCOPED FIRESTORE ARCHITECTURE
 *
 * `hospital_id` is a fixed kiosk/app-level configuration value (KIOSK_HOSPITAL_ID = 'DCH-001')
 * and is strictly NOT derived from any patient input.
 *
 * Every Firestore read/write for patient visits, sessions, encounters, and UHID
 * lookups automatically injects and filters by this hospital_id.
 * ============================================================================
 */

/**
 * Save or Update Global Patient Record in Firestore.
 * IMPORTANT: Global patient document carries ONLY national ABHA ID and demographic info.
 * UHID is strictly omitted because it is hospital-scoped.
 */
export async function registerPatientInFirestore(
  patient: Patient,
  hospitalId: string = KIOSK_HOSPITAL_ID
): Promise<{ success: boolean; id: string }> {
  await ensureAuthSession();
  const patientDocId = patient.id || `pt-${Date.now()}`;
  const docRef = doc(db, 'patients', patientDocId);

  // Strictly exclude UHID from the global patient document
  const globalPatientPayload = {
    id: patientDocId,
    name: patient.name || 'Patient',
    age: Number(patient.age) || 0,
    gender: patient.gender || 'Male',
    phone: patient.phone || '',
    district: patient.district || '',
    state: patient.state || '',
    abhaId: patient.abhaId || '',
    abhaAddress: patient.abhaAddress || '',
    emergencyContact: patient.emergencyContact || '',
    preferredLanguage: patient.preferredLanguage || 'hi',
    mode: patient.mode || 'kiosk',
    authUid: auth.currentUser?.uid || null,
    userId: auth.currentUser?.uid || null,
    originHospitalId: hospitalId, // Kiosk/app level provenance
    registeredAt: patient.registeredAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, globalPatientPayload, { merge: true });
    return { success: true, id: patientDocId };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `patients/${patientDocId}`);
    return { success: false, id: patientDocId };
  }
}

/**
 * Fetch hospital-scoped registration for a specific (patient, hospital) pair.
 * Automatically scopes by kiosk hospital_id if not provided.
 */
export async function getHospitalRegistration(
  patientId: string,
  hospitalId: string = KIOSK_HOSPITAL_ID
): Promise<HospitalRegistration | null> {
  await ensureAuthSession();
  const regDocId = `${patientId}_${hospitalId}`;
  try {
    const regRef = doc(db, 'hospital_registrations', regDocId);
    const snap = await getDoc(regRef);
    if (snap.exists()) {
      return snap.data() as HospitalRegistration;
    }
    // Check subcollection fallback: patients/{patientId}/hospital_registrations/{hospitalId}
    const subRef = doc(db, 'patients', patientId, 'hospital_registrations', hospitalId);
    const subSnap = await getDoc(subRef);
    if (subSnap.exists()) {
      return subSnap.data() as HospitalRegistration;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `hospital_registrations/${regDocId}`);
    return null;
  }
}

/**
 * Core ABDM Kiosk Check:
 * BEFORE generating any UHID, query Firestore for an existing document
 * where hospital_id = "DCH-001" AND patientId/abhaId matches the entered ABHA ID.
 */
export async function queryExistingHospitalRegistration(
  targetHospitalId: string,
  targetAbhaId?: string,
  targetPatientId?: string
): Promise<HospitalRegistration | null> {
  await ensureAuthSession();
  const cleanAbha = targetAbhaId?.trim() || '';
  const cleanPatientId = targetPatientId?.trim() || '';

  // 1. Check hospital_registrations where hospitalId == targetHospitalId AND abhaId == cleanAbha
  if (cleanAbha) {
    try {
      const q = query(
        collection(db, 'hospital_registrations'),
        where('hospitalId', '==', targetHospitalId),
        where('abhaId', '==', cleanAbha),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as HospitalRegistration;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `hospital_registrations?hospitalId=${targetHospitalId}&abhaId=${cleanAbha}`);
    }

    try {
      const qUnder = query(
        collection(db, 'hospital_registrations'),
        where('hospital_id', '==', targetHospitalId),
        where('abhaId', '==', cleanAbha),
        limit(1)
      );
      const snapUnder = await getDocs(qUnder);
      if (!snapUnder.empty) {
        return snapUnder.docs[0].data() as HospitalRegistration;
      }
    } catch (e) {
      // Ignored
    }

    // Also check if hospital_registrations has document where patientId == cleanAbha
    try {
      const qPt = query(
        collection(db, 'hospital_registrations'),
        where('hospitalId', '==', targetHospitalId),
        where('patientId', '==', cleanAbha),
        limit(1)
      );
      const snapPt = await getDocs(qPt);
      if (!snapPt.empty) {
        return snapPt.docs[0].data() as HospitalRegistration;
      }
    } catch (e) {
      // Ignored
    }

    // Also check if patient doc exists with this abhaId in patients collection, and check their registration
    try {
      const qGlobalPatient = query(
        collection(db, 'patients'),
        where('abhaId', '==', cleanAbha),
        limit(1)
      );
      const snapGlobalPatient = await getDocs(qGlobalPatient);
      if (!snapGlobalPatient.empty) {
        const foundGlobalPatientId = snapGlobalPatient.docs[0].id;
        const directDocRef = doc(db, 'hospital_registrations', `${foundGlobalPatientId}_${targetHospitalId}`);
        const directSnap = await getDoc(directDocRef);
        if (directSnap.exists()) {
          return directSnap.data() as HospitalRegistration;
        }

        const subDocRef = doc(db, 'patients', foundGlobalPatientId, 'hospital_registrations', targetHospitalId);
        const subSnap = await getDoc(subDocRef);
        if (subSnap.exists()) {
          return subSnap.data() as HospitalRegistration;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  // 2. Check by targetPatientId if provided
  if (cleanPatientId) {
    try {
      const directRef = doc(db, 'hospital_registrations', `${cleanPatientId}_${targetHospitalId}`);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        return directSnap.data() as HospitalRegistration;
      }

      const q = query(
        collection(db, 'hospital_registrations'),
        where('hospitalId', '==', targetHospitalId),
        where('patientId', '==', cleanPatientId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as HospitalRegistration;
      }
    } catch (e) {
      // Ignored
    }
  }

  return null;
}

/**
 * Save or update hospital-scoped registration record containing hospital-specific UHID.
 * Follows exact ABDM idempotent logic:
 * 1. BEFORE generating any UHID, query Firestore for an existing document 
 *    where hospital_id = "DCH-001" AND patientId/abhaId matches the entered ABHA ID.
 * 2. IF a matching record is found: 
 *    - Return the EXISTING uhid from that record — do not generate a new one.
 *    - Increment visitCount by 1.
 *    - Update lastVisitAt to the current timestamp.
 *    - Do NOT overwrite firstVisitAt or uhid.
 * 3. IF no matching record is found (genuinely first-ever visit to this hospital):
 *    - Generate a new UHID.
 *    - Set visitCount = 1 and firstVisitAt = now.
 *    - Save this as a new document.
 */
export async function saveHospitalRegistration(
  registration: Partial<HospitalRegistration> & { patientId: string; abhaId?: string },
  hospitalId: string = KIOSK_HOSPITAL_ID
): Promise<HospitalRegistration> {
  await ensureAuthSession();
  const resolvedHospitalId = registration.hospitalId || registration.hospital_id || hospitalId;
  const targetAbha = registration.abhaId?.trim() || '';
  const targetPatientId = registration.patientId?.trim() || '';
  const now = new Date().toISOString();

  // 1. BEFORE generating any UHID, query Firestore for an existing document 
  //    where hospital_id = "DCH-001" AND patientId/abhaId matches the entered ABHA ID.
  const existingRecord = await queryExistingHospitalRegistration(
    resolvedHospitalId,
    targetAbha,
    targetPatientId
  );

  let activeRegistration: HospitalRegistration;

  if (existingRecord) {
    // 2. IF a matching record is found: 
    //    - Return the EXISTING uhid from that record — do not generate a new one.
    //    - Increment visitCount by 1.
    //    - Update lastVisitAt to the current timestamp.
    //    - Do NOT overwrite firstVisitAt or uhid.
    const resolvedDocId = existingRecord.id || `${existingRecord.patientId}_${resolvedHospitalId}`;
    activeRegistration = {
      ...existingRecord,
      id: resolvedDocId,
      patientId: existingRecord.patientId || targetPatientId,
      abhaId: existingRecord.abhaId || targetAbha,
      hospitalId: resolvedHospitalId,
      hospital_id: resolvedHospitalId,
      hospitalName: existingRecord.hospitalName || registration.hospitalName || CURRENT_HOSPITAL.name,
      uhid: existingRecord.uhid, // KEEP EXISTING UHID - DO NOT GENERATE NEW ONE
      firstVisitAt: existingRecord.firstVisitAt || now, // PRESERVE firstVisitAt
      lastVisitAt: now, // UPDATE lastVisitAt to current timestamp
      visitCount: (Number(existingRecord.visitCount) || 1) + 1, // INCREMENT visitCount by 1
      tokenNumber: registration.tokenNumber || existingRecord.tokenNumber || 104,
      departmentId: registration.departmentId || existingRecord.departmentId || '',
      registeredAt: existingRecord.registeredAt || now,
    };

    try {
      // Save updated document in root collection
      await setDoc(doc(db, 'hospital_registrations', resolvedDocId), activeRegistration, { merge: true });
      // Keep subcollection synchronized
      await setDoc(
        doc(db, 'patients', activeRegistration.patientId, 'hospital_registrations', resolvedHospitalId),
        activeRegistration,
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `hospital_registrations/${resolvedDocId}`);
    }
  } else {
    // 3. IF no matching record is found (genuinely first-ever visit to this hospital):
    //    - Generate a new UHID.
    //    - Set visitCount = 1 and firstVisitAt = now.
    //    - Save this as a new document.
    const newUHID = registration.uhid || generateHospitalUHID(CURRENT_HOSPITAL);
    const regDocId = `${targetPatientId}_${resolvedHospitalId}`;

    activeRegistration = {
      id: regDocId,
      patientId: targetPatientId,
      abhaId: targetAbha,
      hospitalId: resolvedHospitalId,
      hospital_id: resolvedHospitalId,
      hospitalName: registration.hospitalName || CURRENT_HOSPITAL.name,
      uhid: newUHID,
      firstVisitAt: now,
      lastVisitAt: now,
      visitCount: 1,
      tokenNumber: registration.tokenNumber || 104,
      departmentId: registration.departmentId || '',
      registeredAt: now,
    };

    try {
      // 1. Root collection for cross-hospital indexing
      await setDoc(doc(db, 'hospital_registrations', regDocId), activeRegistration, { merge: true });
      // 2. Subcollection under patient document
      await setDoc(
        doc(db, 'patients', targetPatientId, 'hospital_registrations', resolvedHospitalId),
        activeRegistration,
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `hospital_registrations/${regDocId}`);
    }
  }

  return activeRegistration;
}

/**
 * Fetch all hospital registrations for a patient across all Indian hospitals.
 */
export async function getAllHospitalRegistrationsForPatient(
  patientId: string
): Promise<HospitalRegistration[]> {
  await ensureAuthSession();
  try {
    const q = query(
      collection(db, 'hospital_registrations'),
      where('patientId', '==', patientId)
    );
    const snap = await getDocs(q);
    const results: HospitalRegistration[] = [];
    snap.forEach((d) => {
      results.push(d.data() as HospitalRegistration);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `hospital_registrations?patientId=${patientId}`);
    return [];
  }
}

/**
 * Lookup existing global patient record strictly by identifier (ABHA ID or Mobile Phone).
 * Note: Returned object has no top-level UHID, as UHID is hospital-scoped.
 */
export async function lookupPatientByIdentifier(
  type: 'abha' | 'phone' | 'aadhaar',
  value: string
): Promise<Patient | null> {
  await ensureAuthSession();
  const cleanVal = value.trim();
  if (!cleanVal) return null;

  try {
    const fieldToQuery = type === 'abha' ? 'abhaId' : 'phone';
    const q = query(collection(db, 'patients'), where(fieldToQuery, '==', cleanVal), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const d = snap.docs[0].data();
      return {
        id: d.id || snap.docs[0].id,
        name: d.name,
        age: d.age,
        gender: d.gender,
        phone: d.phone,
        district: d.district,
        state: d.state,
        abhaId: d.abhaId,
        abhaAddress: d.abhaAddress,
        uhid: '', // Strictly omitted on global patient document
        tokenNumber: d.tokenNumber || 104,
        mode: d.mode || 'kiosk',
        emergencyContact: d.emergencyContact || '',
        registeredAt: d.registeredAt || new Date().toISOString(),
        preferredLanguage: d.preferredLanguage || 'hi',
        activeHospitalId: KIOSK_HOSPITAL_ID,
        activeHospitalName: CURRENT_HOSPITAL.name,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `patients?${type}=${value}`);
    return null;
  }
}

/**
 * Lookup patient specifically by Hospital UHID.
 * Automatically scoped by kiosk hospital_id so UHIDs never conflict across hospitals.
 */
export async function lookupPatientByUHID(
  uhid: string,
  hospitalId: string = KIOSK_HOSPITAL_ID
): Promise<{ patient: Patient | null; registration: HospitalRegistration | null }> {
  await ensureAuthSession();
  const cleanUhid = uhid.trim();
  if (!cleanUhid) return { patient: null, registration: null };

  try {
    const q = query(
      collection(db, 'hospital_registrations'),
      where('uhid', '==', cleanUhid),
      where('hospitalId', '==', hospitalId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { patient: null, registration: null };
    }

    const reg = snap.docs[0].data() as HospitalRegistration;
    // Fetch global patient document for demographics
    const patientDoc = await getDoc(doc(db, 'patients', reg.patientId));
    if (patientDoc.exists()) {
      const pData = patientDoc.data();
      const patient: Patient = {
        id: pData.id || reg.patientId,
        name: pData.name,
        age: pData.age,
        gender: pData.gender,
        phone: pData.phone,
        district: pData.district,
        state: pData.state,
        abhaId: pData.abhaId,
        abhaAddress: pData.abhaAddress,
        uhid: reg.uhid,
        tokenNumber: reg.tokenNumber || 104,
        mode: pData.mode || 'kiosk',
        preferredLanguage: pData.preferredLanguage || 'hi',
        activeHospitalId: hospitalId,
        activeHospitalName: reg.hospitalName,
      };
      return { patient, registration: reg };
    }
    return { patient: null, registration: reg };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `hospital_registrations?uhid=${cleanUhid}&hospitalId=${hospitalId}`);
    return { patient: null, registration: null };
  }
}

export interface PatientHospitalResolutionResult {
  patient: Patient;
  hospitalRegistration: HospitalRegistration;
  isExistingGlobalPatient: boolean;
  isExistingHospitalPatient: boolean;
  allHospitalRegistrations: HospitalRegistration[];
}

/**
 * Core ABDM Logic:
 * Resolves a patient against the kiosk's fixed hospital configuration (hospital_id = "DCH-001"):
 * - If they've visited THIS hospital before, returns their existing UHID for this hospital.
 * - If this is their first visit to THIS specific hospital (even if they've visited other hospitals),
 *   generates a new UHID for this hospital and stores it in hospital_registrations.
 * - Their ABHA ID remains identical across all hospitals, always.
 * - The global patient document carries only ABHA ID and demographic info.
 */
export async function resolvePatientForHospital(
  identifierType: 'abha' | 'phone' | 'aadhaar',
  identifierValue: string,
  hospital: HospitalFacility = CURRENT_HOSPITAL,
  fallbackPatientData?: Partial<Patient>
): Promise<PatientHospitalResolutionResult> {
  await ensureAuthSession();

  const cleanVal = identifierValue.trim();
  const enteredAbha =
    identifierType === 'abha' && cleanVal
      ? cleanVal
      : fallbackPatientData?.abhaId?.trim() || '';

  // 1. BEFORE generating any UHID, query Firestore for an existing document 
  //    where hospital_id = "DCH-001" AND patientId/abhaId matches the entered ABHA ID.
  const existingHospReg = await queryExistingHospitalRegistration(
    hospital.id,
    enteredAbha,
    fallbackPatientData?.id
  );

  let globalPatient: Patient | null = null;
  let isExistingHospitalPatient = false;
  let isExistingGlobalPatient = false;

  if (existingHospReg) {
    isExistingHospitalPatient = true;
    isExistingGlobalPatient = true;

    // Load global patient document by existing registration's patientId or ABHA
    if (existingHospReg.patientId) {
      try {
        const pSnap = await getDoc(doc(db, 'patients', existingHospReg.patientId));
        if (pSnap.exists()) {
          const d = pSnap.data();
          globalPatient = {
            id: pSnap.id,
            name: d.name || fallbackPatientData?.name || 'Patient',
            age: d.age || fallbackPatientData?.age || 45,
            gender: d.gender || fallbackPatientData?.gender || 'Male',
            phone: d.phone || fallbackPatientData?.phone || '9876543210',
            district: d.district || fallbackPatientData?.district || 'New Delhi',
            state: d.state || fallbackPatientData?.state || 'Delhi',
            abhaId: d.abhaId || existingHospReg.abhaId || enteredAbha,
            abhaAddress: d.abhaAddress || fallbackPatientData?.abhaAddress || '',
            uhid: existingHospReg.uhid,
            tokenNumber: fallbackPatientData?.tokenNumber || 104,
            mode: d.mode || 'kiosk',
            emergencyContact: d.emergencyContact || fallbackPatientData?.emergencyContact || '',
            registeredAt: d.registeredAt || existingHospReg.firstVisitAt || new Date().toISOString(),
            preferredLanguage: d.preferredLanguage || fallbackPatientData?.preferredLanguage || 'hi',
            activeHospitalId: hospital.id,
            activeHospitalName: hospital.name,
          };
        }
      } catch (e) {
        // Ignored
      }
    }
  }

  // If globalPatient not yet loaded, look up by identifier
  if (!globalPatient) {
    if (enteredAbha) {
      globalPatient = await lookupPatientByIdentifier('abha', enteredAbha);
    }
    if (!globalPatient && identifierType === 'phone') {
      globalPatient = await lookupPatientByIdentifier('phone', cleanVal);
    }
    if (globalPatient) {
      isExistingGlobalPatient = true;
    }
  }

  // If patient does not exist at all globally, create global patient profile
  if (!globalPatient) {
    isExistingGlobalPatient = false;
    const newPatientId = fallbackPatientData?.id || `pt-${Date.now()}`;
    const generatedAbha =
      enteredAbha ||
      fallbackPatientData?.abhaId ||
      `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient: Patient = {
      id: newPatientId,
      tokenNumber: fallbackPatientData?.tokenNumber || 104,
      abhaId: generatedAbha,
      abhaAddress:
        fallbackPatientData?.abhaAddress ||
        `${(fallbackPatientData?.name || 'patient').toLowerCase().replace(/\s+/g, '.')}${Math.floor(Math.random() * 100)}@abdm`,
      uhid: '', // Strictly omitted on global patient document
      name: fallbackPatientData?.name || 'Patient',
      age: fallbackPatientData?.age || 45,
      gender: fallbackPatientData?.gender || 'Male',
      phone:
        fallbackPatientData?.phone || (identifierType === 'phone' ? cleanVal : '9876543210'),
      district: fallbackPatientData?.district || 'New Delhi',
      state: fallbackPatientData?.state || 'Delhi',
      emergencyContact: fallbackPatientData?.emergencyContact || '',
      mode: fallbackPatientData?.mode || 'kiosk',
      preferredLanguage: fallbackPatientData?.preferredLanguage || 'hi',
      registeredAt: new Date().toISOString(),
      activeHospitalId: hospital.id,
      activeHospitalName: hospital.name,
    };

    // Save global patient document (demographics + ABHA ID ONLY)
    await registerPatientInFirestore(newPatient, hospital.id);
    globalPatient = newPatient;
  }

  // 2. Invoke saveHospitalRegistration which executes the exact 3-step idempotent logic:
  //    Step 1: Check Firestore before any UHID generation
  //    Step 2: If found, reuse existing UHID and increment visitCount
  //    Step 3: If not found, generate new UHID and set visitCount = 1
  const activeRegistration = await saveHospitalRegistration(
    {
      patientId: globalPatient.id,
      abhaId: globalPatient.abhaId || enteredAbha,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      tokenNumber: fallbackPatientData?.tokenNumber || globalPatient.tokenNumber || 104,
      departmentId: (fallbackPatientData as any)?.departmentId || '',
    },
    hospital.id
  );

  if (activeRegistration.visitCount > 1) {
    isExistingHospitalPatient = true;
  }

  // 3. Fetch all hospital registrations for this patient across all Indian hospitals
  const allRegistrations = await getAllHospitalRegistrationsForPatient(globalPatient.id);
  // Ensure the active registration is in the list
  const regIndex = allRegistrations.findIndex((r) => r.hospitalId === hospital.id);
  if (regIndex >= 0) {
    allRegistrations[regIndex] = activeRegistration;
  } else {
    allRegistrations.unshift(activeRegistration);
  }

  // Return resolved patient with the hospital-scoped UHID for this session
  const resolvedPatient: Patient = {
    ...globalPatient,
    uhid: activeRegistration.uhid,
    tokenNumber: activeRegistration.tokenNumber || 104,
    activeHospitalId: hospital.id,
    activeHospitalName: hospital.name,
  };

  return {
    patient: resolvedPatient,
    hospitalRegistration: activeRegistration,
    isExistingGlobalPatient,
    isExistingHospitalPatient,
    allHospitalRegistrations: allRegistrations.length > 0 ? allRegistrations : [activeRegistration],
  };
}

/**
 * ============================================================================
 * PATIENT VISITS & CLINICAL SESSIONS (HOSPITAL-SCOPED)
 *
 * Every patient visit and consultation encounter in Firestore is automatically
 * scoped by `hospital_id` = 'DCH-001'.
 * ============================================================================
 */

/**
 * Persist an OPD encounter/visit to Firestore, automatically scoped by hospital_id.
 */
export async function savePatientVisitEncounter(
  encounter: OPDEncounter,
  hospitalId: string = KIOSK_HOSPITAL_ID
): Promise<boolean> {
  await ensureAuthSession();
  const encounterDocId = `${hospitalId}_${encounter.id}`;
  const payload = {
    ...encounter,
    id: encounter.id,
    hospitalId: hospitalId,
    hospital_id: hospitalId,
    hospitalName: encounter.hospitalName || CURRENT_HOSPITAL.name,
    patientId: encounter.patient.id,
    patientUhid: encounter.patient.uhid,
    patientAbhaId: encounter.patient.abhaId,
    createdAt: encounter.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // 1. Root encounters collection scoped by hospital_id
    await setDoc(doc(db, 'encounters', encounterDocId), payload, { merge: true });

    // 2. Patient's visits subcollection: patients/{patientId}/visits/{hospitalId}_{encounterId}
    await setDoc(
      doc(db, 'patients', encounter.patient.id, 'visits', encounterDocId),
      payload,
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `encounters/${encounterDocId}`);
    return false;
  }
}

/**
 * Fetch all clinical visits/encounters for the current hospital terminal.
 * Automatically filters by `where('hospital_id', '==', hospitalId)`.
 */
export async function getHospitalEncounterQueue(
  hospitalId: string = KIOSK_HOSPITAL_ID
): Promise<OPDEncounter[]> {
  await ensureAuthSession();
  try {
    const q = query(
      collection(db, 'encounters'),
      where('hospital_id', '==', hospitalId)
    );
    const snap = await getDocs(q);
    const results: OPDEncounter[] = [];
    snap.forEach((d) => {
      results.push(d.data() as OPDEncounter);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `encounters?hospital_id=${hospitalId}`);
    return [];
  }
}

/**
 * Persist an active kiosk intake session state, automatically scoped by hospital_id.
 */
export async function savePatientSession(
  sessionId: string,
  sessionData: Record<string, any>,
  hospitalId: string = KIOSK_HOSPITAL_ID
): Promise<boolean> {
  await ensureAuthSession();
  const sessionDocId = `${hospitalId}_${sessionId}`;
  try {
    await setDoc(
      doc(db, 'sessions', sessionDocId),
      {
        ...sessionData,
        sessionId,
        hospitalId,
        hospital_id: hospitalId,
        hospitalName: CURRENT_HOSPITAL.name,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sessions/${sessionDocId}`);
    return false;
  }
}

// Sign out / reset session
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Auth sign-out error:', error);
  }
}
