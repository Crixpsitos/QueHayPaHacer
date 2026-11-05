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
  const inEventFolder = !!path && path.startsWith(`public/events/${eventId}/`) && !path.split("/").includes("..")
  const isOriginal = !!path && !path.split("/").pop()!.startsWith("optimized_")
  return inEventFolder && isOriginal ? { kind: "rewrite", path } : { kind: "bad-path" }
}
