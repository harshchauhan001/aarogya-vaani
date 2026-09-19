import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  ensureAuthSession,
  logOut,
  testConnection,
  registerPatientInFirestore,
  lookupPatientByIdentifier,
} from '../firebase';
import { Patient } from '../types';

interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  ensureSession: () => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  registerPatient: (
    patient: Patient
  ) => Promise<{ success: boolean; id: string; error?: string }>;
  lookupPatient: (
    type: 'abha' | 'phone',
    value: string
  ) => Promise<Patient | null>;
  isConnected: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  loading: true,
  ensureSession: async () => null,
  signOut: async () => {},
  registerPatient: async () => ({ success: false, id: '' }),
  lookupPatient: async () => null,
  isConnected: false,
});

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Test Firestore connection on boot
    testConnection().then((connected) => {
      setIsConnected(connected);
    });

    // Automatically ensure anonymous session for the kiosk / patient
    ensureAuthSession()
      .then((currUser) => {
        setUser(currUser);
      })
      .catch((err) => {
        console.warn('Initial session auth setup:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEnsureSession = async (): Promise<FirebaseUser | null> => {
    return ensureAuthSession();
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await logOut();
      setUser(null);
    } catch (err) {
      console.error('Sign-out failed:', err);
      throw err;
    }
  };

  const handleRegisterPatient = async (
    patient: Patient
  ): Promise<{ success: boolean; id: string; error?: string }> => {
    try {
      const res = await registerPatientInFirestore(patient);
      return res;
    } catch (err: any) {
      console.error('Failed to register patient in Firestore:', err);
      return { success: false, id: '', error: err?.message || 'Failed to save' };
    }
  };

  const handleLookupPatient = async (
    type: 'abha' | 'phone',
    value: string
  ): Promise<Patient | null> => {
    return lookupPatientByIdentifier(type, value);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        ensureSession: handleEnsureSession,
        signOut: handleSignOut,
        registerPatient: handleRegisterPatient,
        lookupPatient: handleLookupPatient,
        isConnected,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => useContext(FirebaseAuthContext);
