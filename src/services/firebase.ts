import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase singleton
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

// Critical constraint from Firebase integration skill: validate connection to Firestore on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'app_configs', 'system'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, utilizing local secure cache.');
    }
    return false;
  }
}

// Kick off background connectivity validation
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}

export default app;
