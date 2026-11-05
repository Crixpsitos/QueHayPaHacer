/** Reglas puras de Analytics: qué rutas se miden y qué parámetros pueden salir. Sin DOM ni SDK (testeable). */

export type AnalyticsEventName =
  | "page_view"
  | "view_item"
  | "click_whatsapp"
  | "click_como_llegar"
  | "share"
  | "like"
  | "register_event"
  | "search";

// Mismas rutas privadas que proxy.ts (+ estudio, API y herramientas internas).
const PRIVATE_PREFIXES = ["/studio", "/mis-eventos", "/mis-inscripciones", "/mis-invitaciones", "/sites", "/eventos/create", "/api", "/dev", "/reset-password"];
const PRIVATE_EVENT_PATH = /^\/eventos\/[^/]+\/(edit(\/.*)?|sessions\/?)$/;

export function isTrackablePath(pathname: string): boolean {
  if (pathname === "/profile") return false; // /profile/<usuario> es público
  if (PRIVATE_EVENT_PATH.test(pathname)) return false;
  return !PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Lista permitida: lo que no esté aquí no sale nunca (uid, correo, nombre, texto de búsqueda...).
const ALLOWED_PARAMS = new Set(["item_type", "item_id", "item_category", "method", "destination"]);
const MAX_VALUE = 100;

export function sanitizeParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_PARAMS.has(key)) continue;
    if (typeof value === "string" && value.length <= MAX_VALUE) out[key] = value;
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

const KEEP_QUERY = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"];

/** URL para `page_location`: solo UTM y click ids, nunca `redirect_to`, tokens ni hash. */
export function cleanLocation(href: string): string {
  const url = new URL(href);
  const kept = new URLSearchParams();
  for (const key of KEEP_QUERY) {
    const value = url.searchParams.get(key);
    if (value) kept.set(key, value);
  }
  const query = kept.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
}
