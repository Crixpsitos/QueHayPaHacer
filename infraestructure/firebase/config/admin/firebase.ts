import { firebaseConfig } from "../client/firebase";
import { TokenSet } from "next-firebase-auth-edge/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

export const serverConfig = {
    useSecureCookies: process.env.NODE_ENV === 'production',
    firebaseApiKey: process.env.FIREBASE_API_KEY!,
    serviceAccount: {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    },
}

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
  serviceAccount: serverConfig.serviceAccount,
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

const getAdminApp = () => {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;
  return initializeApp(
    {
      credential: cert({
        projectId: serverConfig.serviceAccount.projectId,
        privateKey: serverConfig.serviceAccount.privateKey,
        clientEmail: serverConfig.serviceAccount.clientEmail,
      }),
    },
    ADMIN_APP_NAME
  );
};

export const getFirebaseFirestore = () => getFirestore(getAdminApp());

export const getFirebaseAdminAuth = () => getAuth(getAdminApp());

