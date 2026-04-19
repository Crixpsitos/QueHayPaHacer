import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectAuthEmulator, getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";

const {NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_TENANT_ID, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID, NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID } = process.env;

export const firebaseConfig = {
  apiKey: NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
 // Optional – required if your app uses Multi-Tenancy – https://cloud.google.com/identity-platform/docs/multi-tenancy-authentication
  tenantId: NEXT_PUBLIC_FIREBASE_AUTH_TENANT_ID
};

export const getFirebaseApp = () => {
  if (getApps().length) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};
export const getFirebaseAuth = () => {
  const auth = getAuth(getFirebaseApp());
  
  setPersistence(auth, inMemoryPersistence)
  if (process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST) {
    (auth as unknown as any)._canInitEmulator = true;
    connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST}`, {
      disableWarnings: true
    });
  }

  if (firebaseConfig.tenantId) {
    auth.tenantId = firebaseConfig.tenantId;
  }

  return auth;
}
export const getFirebaseAnalytics = () => {
  return getAnalytics(getFirebaseApp());
}



