import { getFirebaseApp } from "@/infraestructure/firebase/config/client/firebase";
import { createAnalytics, type AnalyticsSdk } from "./client";

/** Instancia única para toda la app (solo se usa desde componentes cliente; el SDK se importa al primer envío). */
export const analytics = createAnalytics({
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  getApp: getFirebaseApp,
  loadSdk: async () => (await import("firebase/analytics")) as unknown as AnalyticsSdk,
});
