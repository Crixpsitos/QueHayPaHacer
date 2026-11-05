export type ConsentChoice = "granted" | "denied";

export const CONSENT_KEY = "qhpa-analytics-consent";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// localStorage puede lanzar (modo privado, datos bloqueados): sin él simplemente no hay decisión guardada.
function defaultStore(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export const parseConsent = (raw: string | null | undefined): ConsentChoice | null =>
  raw === "granted" || raw === "denied" ? raw : null;

export function readConsent(store: Store | undefined = defaultStore()): ConsentChoice | null {
  try {
    return parseConsent(store?.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice, store: Store | undefined = defaultStore()): void {
  try {
    store?.setItem(CONSENT_KEY, choice);
  } catch {}
}

export function clearConsent(store: Store | undefined = defaultStore()): void {
  try {
    store?.removeItem(CONSENT_KEY);
  } catch {}
}
