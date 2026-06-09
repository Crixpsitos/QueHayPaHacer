import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";



export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  // Optional – required if your app uses Multi-Tenancy – https://cloud.google.com/identity-platform/docs/multi-tenancy-authentication
  tenantId: process.env.NEXT_PUBLIC_FIREBASE_AUTH_TENANT_ID,
};

export const getFirebaseApp = () => {
  if (getApps().length) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};
export const getFirebaseAuth = () => {
  const auth = getAuth(getFirebaseApp());

  setPersistence(auth, inMemoryPersistence);
  if (process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as unknown as any)._canInitEmulator = true;
    connectAuthEmulator(
      auth,
      `http://${process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST}`,
      {
        disableWarnings: true,
      },
    );
  }

  if (firebaseConfig.tenantId) {
    auth.tenantId = firebaseConfig.tenantId;
  }

  return auth;
};
export const getFirebaseAnalytics = () => {
  return getAnalytics(getFirebaseApp());
};

export const getFirebaseFirestore = () =>
  getFirestore(getFirebaseApp(), "quehaypahacer-db");
