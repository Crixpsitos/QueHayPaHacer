import { firebaseConfig } from "../client/firebase";
import { TokenSet } from "next-firebase-auth-edge/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getStorage } from 'firebase-admin/storage';
import { Firestore as EnterpriseFirestore } from "@google-cloud/firestore";

export const serverConfig = {
    useSecureCookies: process.env.NODE_ENV === 'production',
    firebaseApiKey: process.env.FIREBASE_API_KEY!,
}

const getServiceAccount = () => {
  const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
  return {
    projectId: json.project_id as string,
    privateKey: json.private_key as string,
    clientEmail: json.client_email as string,
  };
};

export const authConfig = {
  apiKey: serverConfig.firebaseApiKey,
  cookieName: 'AuthToken',
  cookieSignatureKeys: [
    process.env.COOKIE_SECRET_CURRENT!,
    process.env.COOKIE_SECRET_PREVIOUS!
  ],
  cookieSerializeOptions: {
    path: '/',
    httpOnly: true,
    secure: serverConfig.useSecureCookies,
    sameSite: 'lax' as const,
    maxAge: 12 * 60 * 60 * 24 // twelve days
  },
  serviceAccount: getServiceAccount(),
  // Set to false in Firebase Hosting environment due to https://stackoverflow.com/questions/44929653/firebase-cloud-function-wont-store-cookie-named-other-than-session
  enableMultipleCookies: true,
  // Set to false if you're not planning to use `signInWithCustomToken` Firebase Client SDK method
  enableCustomToken: true,
  enableTokenRefreshOnExpiredKidHeader: true,
  debug: false,
  tenantId: firebaseConfig.tenantId,
  getMetadata: async (tokens: TokenSet) => {
    return {uid: tokens.decodedIdToken.uid, timestamp: new Date().getTime()};
  },
  dynamicCustomClaimsKeys: ['someCustomClaim']
};

const ADMIN_APP_NAME = "firebase-admin-server";
let enterpriseFirestoreInstance: EnterpriseFirestore | null = null;

const getAdminApp = () => {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;
  const serviceAccount = getServiceAccount();
  return initializeApp(
    {
      credential: cert({
        projectId: serviceAccount.projectId,
        privateKey: serviceAccount.privateKey,
        clientEmail: serviceAccount.clientEmail,
      }),
      storageBucket: firebaseConfig.storageBucket,

    },
    ADMIN_APP_NAME
  );
};

export const getFirebaseFirestore = () => getFirestore(getAdminApp(), 'quehaypahacer-db');

export const getEnterpriseFirestore = (): EnterpriseFirestore => {
  if (enterpriseFirestoreInstance) {
    return enterpriseFirestoreInstance;
  }

  const serviceAccount = getServiceAccount();
  enterpriseFirestoreInstance = new EnterpriseFirestore({
    projectId: serviceAccount.projectId,
    databaseId: 'quehaypahacer-db',
    keyFilename: undefined,
    credentials: {
      client_email: serviceAccount.clientEmail,
      private_key: serviceAccount.privateKey,
    },
  });

  return enterpriseFirestoreInstance;
};

export const getFirebaseAdminAuth = () => getAuth(getAdminApp());

export const getFirebaseStorage = () => getStorage(getAdminApp());

