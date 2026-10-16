/** Lógica pura de listados de eventos (destacados y cursor de "Todos"). */

export const FEATURED_MAX = 10;

/** ¿Promoción vigente? `promotedUntil` puede venir como Timestamp de Firestore o Date. */
export function isPromotionActive(
  promotion: { isPromoted?: boolean; promotedUntil?: { toDate(): Date } | Date | null } | undefined,
  now: Date,
): boolean {
  if (!promotion?.isPromoted || !promotion.promotedUntil) return false;
  const until =
    promotion.promotedUntil instanceof Date ? promotion.promotedUntil : promotion.promotedUntil.toDate();
  return until.getTime() >= now.getTime();
}

/** Promovidos primero, luego los mejor puntuados; sin duplicados, tope `max`. */
export function mergeFeaturedIds(promoted: string[], topScored: string[], max = FEATURED_MAX): string[] {
  return [...new Set([...promoted, ...topScored])].slice(0, max);
}

/** Cursor estable `score|id`: el id desempata eventos con el mismo score. */
export function encodeScoreCursor(score: number, id: string): string {
  return `${score}|${id}`;
}

export function decodeScoreCursor(cursor: string | null): { score: number; id: string } | null {
  if (!cursor) return null;
  const i = cursor.indexOf("|");
  if (i < 1) return null;
  const score = Number(cursor.slice(0, i));
  const id = cursor.slice(i + 1);
  return Number.isFinite(score) && id ? { score, id } : null;
}
