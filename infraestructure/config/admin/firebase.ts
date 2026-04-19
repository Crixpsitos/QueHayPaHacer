import service_account from "@/quehaypahacerAccountService.json";
import { firebaseConfig } from "../client/firebase";
import { TokenSet } from "next-firebase-auth-edge/auth";


const {FIREBASE_API_KEY, COOKIE_SECRET_CURRENT, COOKIE_SECRET_PREVIOUS} = process.env;

export const serverConfig = {
    useSecureCookies: process.env.NODE_ENV === 'production',
    firebaseApiKey: FIREBASE_API_KEY!,
    serviceAccount: service_account,
}

export const authConfig = {
  apiKey: serverConfig.firebaseApiKey,
  cookieName: 'AuthToken',
  cookieSignatureKeys: [
    COOKIE_SECRET_CURRENT!,
    COOKIE_SECRET_PREVIOUS!
  ],
  cookieSerializeOptions: {
    path: '/',
    httpOnly: true,
    secure: serverConfig.useSecureCookies, // Set this to true on HTTPS environments
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