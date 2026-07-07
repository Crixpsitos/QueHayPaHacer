import type { SiteInteractionsPoint } from "@/domain/entities/studio/Studio";

/** Segundos en una semana (7 · 86400). Divisor del bucket temporal. */
export const WEEK_SECONDS = 604800;

/** Fila cruda del aggregate por (semana, tipo) del pipeline de interacciones. */
export interface WeekBucketRow {
  week: number;
  /** "click" | "like" | "share" (cualquier otro valor se ignora). */
  type: string;
  total: number;
}

/**
 * Pivota las filas `(semana, tipo) → conteo` a una serie continua de `weeks`
 * puntos, rellenando con 0 las semanas sin interacciones. Mismo espíritu que la
 * densificación de `getRegistrationsTimeline`, pero pivotando además por tipo.
 *
 * bucket 0 = semana más vieja de la ventana, bucket `weeks-1` = semana actual.
 * `weekStart` se deriva de `windowStartSeconds + w · WEEK_SECONDS`.
 */
export function buildWeeklyInteractions(
  rows: WeekBucketRow[],
  windowStartSeconds: number,
  weeks: number,
): SiteInteractionsPoint[] {
  const perWeek = new Map<number, { clicks: number; likes: number; shares: number }>();

  for (const { week, type, total } of rows) {
    const bucket = perWeek.get(week) ?? { clicks: 0, likes: 0, shares: 0 };
    const n = Number(total ?? 0);
    if (type === "click") bucket.clicks += n;
    else if (type === "like") bucket.likes += n;
    else if (type === "share") bucket.shares += n;
    perWeek.set(week, bucket);
  }

  return Array.from({ length: weeks }, (_, w) => {
    const b = perWeek.get(w) ?? { clicks: 0, likes: 0, shares: 0 };
    const weekStart = new Date((windowStartSeconds + w * WEEK_SECONDS) * 1000)
      .toISOString()
      .split("T")[0];
    return { weekStart, clicks: b.clicks, likes: b.likes, shares: b.shares };
  });
}
