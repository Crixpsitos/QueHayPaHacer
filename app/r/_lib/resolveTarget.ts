/**
 * Destinos de las rutas `/r/e|s/[id]`. REGLA: el destino sale SIEMPRE de un documento guardado, nunca de la URL de la
 * petición (la URL solo elige cuál campo del documento). Así no hay redirección abierta.
 */

const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const LOCAL_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home", ".corp"];

/** http(s) con host público: sin credenciales, sin IP literal (v4/v6), sin localhost ni sufijos internos. Devuelve la URL normalizada o null. */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  let u: URL;
  try {
    u = new URL(value.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") || host.startsWith("[") || IPV4.test(host)) return null; // sin IP literal: ni públicas (ponytail: simple y seguro)
  if (host === "localhost" || LOCAL_SUFFIXES.some((s) => host.endsWith(s))) return null;
  return u.href;
}

export const EVENT_OUT_TARGETS = ["register"] as const; // ponytail: el evento solo guarda `externalUrl`; website/booking llegan si el modelo los agrega
export const SITE_OUT_TARGETS = ["website", "booking", "social"] as const; // `call`: el sitio no guarda teléfono
export const SITE_SOCIAL_NETWORKS = ["instagram", "facebook", "tiktok", "twitter"] as const;

export function resolveEventTarget(to: string | null, doc: { externalUrl?: string }): string | null {
  return to === "register" ? safeHttpUrl(doc.externalUrl) : null;
}

export function resolveSiteTarget(
  to: string | null,
  network: string | null,
  doc: { bookingUrl?: string; socialMedia?: Record<string, string | undefined> },
): string | null {
  if (to === "website") return safeHttpUrl(doc.socialMedia?.website);
  if (to === "booking") return safeHttpUrl(doc.bookingUrl);
  if (to === "social" && SITE_SOCIAL_NETWORKS.includes(network as (typeof SITE_SOCIAL_NETWORKS)[number])) {
    return safeHttpUrl(doc.socialMedia?.[network as string]);
  }
  return null;
}
