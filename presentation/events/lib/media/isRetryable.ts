/** Tiempo en "processing" tras el cual se ofrece "Reintentar" (los items no guardan hora: se mide desde que se vieron). */
export const RETRY_AFTER_MS = 3 * 60 * 1000

export function isRetryable(
  status: "processing" | "ready" | "error" | undefined,
  firstSeenAt: number | undefined,
  now: number,
): boolean {
  if (status === "error") return true
  return status === "processing" && firstSeenAt !== undefined && now - firstSeenAt >= RETRY_AFTER_MS
}
