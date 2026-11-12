"use server"

import { getSessionUid } from "@/app/actions/_session"
import { isGoogleMapsHost, parseMapsCoords, type LatLng } from "@/domain/entities/places/mapsLink"

/**
 * Coordenadas de un enlace de Google Maps (largo o corto: maps.app.goo.gl). Solo con sesión. Los enlaces cortos se expanden aquí
 * siguiendo redirecciones A MANO y SOLO hacia hosts de Google (máx. 5 saltos): así nadie usa esto para pedir otras direcciones.
 */
export async function resolveMapsLinkAction(raw: string): Promise<{ ok: true; coords: LatLng } | { ok: false; error: string }> {
  if (!(await getSessionUid())) return { ok: false, error: "Inicia sesión para usar esto." }
  const direct = parseMapsCoords(raw)
  if (direct) return { ok: true, coords: direct }
  let url: URL
  try { url = new URL(raw.trim()) } catch { return { ok: false, error: "Pega el enlace completo de Google Maps (empieza por https://)." } }
  try {
    for (let hop = 0; hop < 5; hop++) {
      if (url.protocol !== "https:" || !isGoogleMapsHost(url.hostname)) return { ok: false, error: "Solo sirven enlaces de Google Maps." }
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(6000), headers: { "user-agent": "Mozilla/5.0 (compatible; QHPA-link-resolver)" } })
      const loc = res.headers.get("location")
      const found = parseMapsCoords(loc ?? url.toString())
      if (found) return { ok: true, coords: found }
      if (!loc || res.status < 300 || res.status >= 400) break
      url = new URL(loc, url)
    }
  } catch { return { ok: false, error: "No pudimos abrir ese enlace. Intenta de nuevo." } }
  return { ok: false, error: "No encontramos la ubicación en ese enlace. Abre el lugar en Google Maps, toca Compartir y copia el enlace." }
}
