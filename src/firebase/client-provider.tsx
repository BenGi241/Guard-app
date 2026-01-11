'use client';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { ReactNode, createContext, useContext } from 'react';
import { FirebaseProvider, getFirebaseConfig } from './provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

function getFirebase() {
  if (!firebaseApp) {
    const firebaseConfig = getFirebaseConfig();
    if (firebaseConfig) {
      firebaseApp = initializeApp(firebaseConfig);
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
    }
  }
  return { firebaseApp, auth, firestore };
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore } = getFirebase();
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

export default FirebaseClientProvider;
