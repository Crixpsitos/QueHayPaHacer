"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/store/auth/AuthContext";
import { analytics } from "@/app/lib/analytics";
import { useConsent } from "@/app/lib/analytics/useConsent";

// Si la sesión tarda más que esto en confirmarse, se mide igual (como visita anónima) para no perder la visita.
const AUTH_WAIT_MS = 3000;

/** Sin UI: manda `login_state` y un `page_view` por cada cambio de ruta pública (filtros con ?query no cuentan). */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const { user, isHydrating } = useAuth();
  const { state: consent } = useConsent();
  const [timedOut, setTimedOut] = useState(false);
  // Se espera a conocer la decisión de cookies: el consentimiento debe fijarse ANTES del primer envío.
  const ready = (!isHydrating || timedOut) && consent !== "unknown";

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), AUTH_WAIT_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (consent !== "unknown") analytics.setConsent(consent === "granted");
  }, [consent]);

  useEffect(() => {
    if (ready) analytics.setLoginState(user ? "logged_in" : "anon");
  }, [ready, user]);

  useEffect(() => {
    if (ready) analytics.pageView(window.location.href);
  }, [ready, pathname]);

  return null;
}
