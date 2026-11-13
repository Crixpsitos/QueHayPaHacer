/**
 * Lo que una persona agrega a «Mis planes» con el botón «Agregar a mi plan»: un EVENTO (entra con su día y hora, que son fijos)
 * o un SITIO para visitar (con el día y la hora que ella elija, o sin día). Las actividades siguen su propio camino (guardadas).
 * Es explícito: marcar «Voy a ir» o «Me gusta» ya no mete nada al plan.
 */
export const PLAN_ITEM_KINDS = ["event", "site"] as const
export type PlanItemKind = (typeof PLAN_ITEM_KINDS)[number]
export interface PlanItemSlot { date: string | null; time: string | null }
export interface PlanItem extends PlanItemSlot { kind: PlanItemKind; refId: string }

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DAY = 86_400_000

export const isPlanKind = (x: unknown): x is PlanItemKind => (PLAN_ITEM_KINDS as readonly unknown[]).includes(x)
export const isPlanRefId = (x: unknown): x is string => typeof x === "string" && ID_RE.test(x)
/** Clave del documento y del bloque en la semana: `event_<id>` o `site_<id>`. */
export const planKey = (kind: PlanItemKind, refId: string): string => `${kind}_${refId}`
export function parsePlanKey(key: string): { kind: PlanItemKind; refId: string } | null {
  const i = key.indexOf("_")
  const kind = key.slice(0, i), refId = key.slice(i + 1)
  return i > 0 && isPlanKind(kind) && isPlanRefId(refId) ? { kind, refId } : null
}

/**
 * Día y hora que elige la persona para un sitio: el día va dentro de esta semana (hoy + 6) o queda vacío («sin día por ahora»),
 * y la hora solo existe si hay día. Devuelve el motivo del error o null.
 */
export function planSlotError(slot: PlanItemSlot, today: string): string | null {
  if (slot.date === null) return slot.time === null ? null : "Elige primero el día."
  if (!DATE_RE.test(slot.date)) return "El día no es válido."
  const diff = Date.parse(`${slot.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  if (!(diff >= 0 && diff <= 6 * DAY)) return "Elige un día de esta semana."
  if (slot.time !== null && !HHMM_RE.test(slot.time)) return "La hora no es válida."
  return null
}
