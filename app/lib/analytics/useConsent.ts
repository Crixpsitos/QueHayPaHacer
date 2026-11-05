"use client";

import { useCallback, useSyncExternalStore } from "react";
import { clearConsent, readConsent, saveConsent, type ConsentChoice } from "./consent";

/** unknown = aún no se sabe (servidor / primer render); pending = hay que preguntar; el resto = decisión guardada. */
export type ConsentState = "unknown" | "pending" | ConsentChoice;

const CHANGE_EVENT = "qhpa-consent-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // otra pestaña decidió
  window.addEventListener(CHANGE_EVENT, onChange); // esta pestaña decidió
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export function useConsent() {
  const state = useSyncExternalStore<ConsentState>(subscribe, () => readConsent() ?? "pending", () => "unknown");
  const choose = useCallback((choice: ConsentChoice) => {
    saveConsent(choice);
    notify();
  }, []);
  /** Vuelve a preguntar (enlace "Preferencias de cookies" del pie). */
  const reopen = useCallback(() => {
    clearConsent();
    notify();
  }, []);
  return { state, accept: () => choose("granted"), reject: () => choose("denied"), reopen };
}
