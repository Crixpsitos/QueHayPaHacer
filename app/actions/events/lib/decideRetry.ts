type Item = { id: string; data?: unknown }

export type RetryDecision =
  | { kind: "rewrite"; path: string }
  | { kind: "already-ready" }
  | { kind: "not-found" }
  | { kind: "bad-path" }

/**
 * Decide qué hacer al "Reintentar" un medio de evento. Solo se reescribe el ORIGINAL (`deoptimized-*`) que está en la
 * carpeta del propio evento: el CF vuelve a dispararse y es el único que escribe `ready` (no duplicamos su lógica).
 */
export function decideRetry(eventId: string, media: Item[], mediaId: string): RetryDecision {
  const item = media.find((m) => m.id === mediaId)
  if (!item) return { kind: "not-found" }
  const data = item.data as { status?: string; path?: string } | undefined
  if (data?.status === "ready") return { kind: "already-ready" }

  const path = data?.path
  if (!path || path.includes("\\")) return { kind: "bad-path" }
  const parts = path.split("/")
  // Segmentos vacíos o ".." no valen; solo originales `deoptimized-*` dentro de la carpeta del propio evento.
  const clean = !parts.includes("..") && !parts.includes("")
  const inEventFolder = path.startsWith(`public/events/${eventId}/`)
  const isOriginal = parts[parts.length - 1].startsWith("deoptimized-")
  return clean && inEventFolder && isOriginal ? { kind: "rewrite", path } : { kind: "bad-path" }
}

/** Enfriamiento sin tocar el documento: cada reintento reescribe el objeto y renueva su fecha de modificación. */
export const RETRY_COOLDOWN_MS = 2 * 60 * 1000
export const canRetryNow = (ageMs: number) => ageMs >= RETRY_COOLDOWN_MS
