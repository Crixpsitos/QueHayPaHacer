"use client";

import { useConsent } from "@/app/lib/analytics/useConsent";

/** Enlace del pie de página: vuelve a mostrar el aviso para cambiar la decisión. */
export function CookiePreferencesButton() {
  const { reopen } = useConsent();
  return (
    <button type="button" onClick={reopen} className="text-left transition-colors hover:text-white">
      Preferencias de cookies
    </button>
  );
}
