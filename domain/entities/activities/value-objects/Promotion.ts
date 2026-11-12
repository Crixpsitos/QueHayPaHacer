/**
 * Promociones de una actividad de SITIO («Tardes felices», «Black Sunday»). Van dentro de la actividad (máx. 5), caducan
 * solas por su vigencia final y NUNCA se muestran vencidas. Solo informan y filtran: no calculan cobros.
 */
export const PROMOTIONS_MAX = 5
export const PROMO_TITLE_MIN = 3
export const PROMO_TITLE_MAX = 60
export const PROMO_DESC_MAX = 240
export const PROMO_TERMS_MAX = 160
export const PROMO_RULE_KINDS = ["percent", "twoForOne", "freeItem", "fixedPrice", "other"] as const
export type PromoRuleKind = (typeof PROMO_RULE_KINDS)[number]
const MAX_SPAN_DAYS = 366

export interface Promotion {
  id: string
  title: string
  description: string
  rule: { kind: PromoRuleKind; value?: number }
  /** 0=domingo … 6=sábado. Vacío = todos los días. */
  weekdays: number[]
  /** "HH:MM" o "" (todo el día). Ambas o ninguna. */
  start: string
  end: string
  /** YYYY-MM-DD (Bogotá). La vigencia final es obligatoria: evita información vieja. */
  validFrom: string
  validUntil: string
  termsNote: string
  paused: boolean
}

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|org|app|io|me|ly|info|biz)\b)/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DAY = 86_400_000
const BOGOTA = 5 * 3_600_000
const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

export function validatePromotions(list: Promotion[]): string | null {
  if (!Array.isArray(list)) return "Promociones inválidas."
  if (list.length > PROMOTIONS_MAX) return `Máximo ${PROMOTIONS_MAX} promociones.`
  for (const x of list) {
    const t = x.title.trim()
    if (t.length < PROMO_TITLE_MIN || t.length > PROMO_TITLE_MAX) return `El título de la promoción debe tener entre ${PROMO_TITLE_MIN} y ${PROMO_TITLE_MAX} caracteres.`
    if (x.description.length > PROMO_DESC_MAX) return `La descripción de la promoción admite máximo ${PROMO_DESC_MAX} caracteres.`
    if (x.termsNote.length > PROMO_TERMS_MAX) return `Las condiciones admiten máximo ${PROMO_TERMS_MAX} caracteres.`
    if (/[<>]/.test(`${t}${x.description}${x.termsNote}`)) return "La promoción no puede contener código ni etiquetas."
    if (URL_RE.test(`${t} ${x.description} ${x.termsNote}`)) return "La promoción no puede contener enlaces: usa el botón de acción."
    if (!(PROMO_RULE_KINDS as readonly string[]).includes(x.rule.kind)) return "Tipo de promoción inválido."
    if (x.rule.value !== undefined && (!Number.isFinite(x.rule.value) || x.rule.value < 0 || x.rule.value > 100_000_000)) return "El valor de la promoción no es válido."
    if (!DATE_RE.test(x.validUntil)) return "Indica hasta cuándo vale la promoción: toda promoción caduca."
    if (!DATE_RE.test(x.validFrom)) return "Indica desde cuándo vale la promoción."
    if (day(x.validUntil) < day(x.validFrom)) return "La promoción no puede terminar antes de empezar."
    if ((day(x.validUntil) - day(x.validFrom)) / DAY > MAX_SPAN_DAYS) return "Una promoción puede durar como máximo un año."
    if (!x.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return "Días de la promoción inválidos."
    if ((x.start === "") !== (x.end === "")) return "Pon la hora de inicio y la de fin, o deja las dos vacías (todo el día)."
    if (x.start && (!HHMM_RE.test(x.start) || !HHMM_RE.test(x.end) || x.end <= x.start)) return "La hora de fin debe ser después de la de inicio."
  }
  return null
}

export const normalizePromotions = (list: Promotion[]): Promotion[] =>
  list
    .map((x) => ({ ...x, id: x.id || crypto.randomUUID().slice(0, 12), title: x.title.trim(), description: x.description.trim(), termsNote: x.termsNote.trim(), weekdays: [...new Set(x.weekdays)].sort((a, b) => a - b) }))
    .filter((x) => x.title)
    .slice(0, PROMOTIONS_MAX)

const bogota = (now: Date) => new Date(now.getTime() - BOGOTA)
/** ¿Está dentro de su vigencia (fechas inclusive) y sin pausar? Una vencida NUNCA se muestra. */
export function isPromoCurrent(p: Promotion, now: Date): boolean {
  if (p.paused) return false
  const today = bogota(now).toISOString().slice(0, 10)
  return p.validFrom <= today && today <= p.validUntil
}
/** ¿Aplica en este momento (día de la semana y franja horaria de Bogotá)? */
export function isPromoLive(p: Promotion, now: Date): boolean {
  if (!isPromoCurrent(p, now)) return false
  const t = bogota(now)
  if (p.weekdays.length && !p.weekdays.includes(t.getUTCDay())) return false
  if (!p.start) return true
  const hhmm = `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`
  return hhmm >= p.start && hhmm < p.end
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const hour = (hhmm: string) => { const h = Number(hhmm.slice(0, 2)); return `${h % 12 === 0 ? 12 : h % 12}:${hhmm.slice(3)}` }
const ampm = (hhmm: string) => (Number(hhmm.slice(0, 2)) < 12 ? "a. m." : "p. m.")

/** «Lun a vie · 3:00 a 6:00 p. m.» */
export function promoScheduleLabel(p: Pick<Promotion, "weekdays" | "start" | "end">): string {
  const ds = [...p.weekdays].sort((a, b) => a - b)
  const contiguous = ds.length > 2 && ds.every((d, i) => i === 0 || d === ds[i - 1] + 1)
  const days = !ds.length ? "Todos los días" : contiguous ? `${DAYS[ds[0]]} a ${DAYS[ds[ds.length - 1]].toLowerCase()}` : ds.map((d) => DAYS[d]).join(", ")
  if (!p.start) return days
  return `${days} · ${hour(p.start)}${ampm(p.start) === ampm(p.end) ? "" : ` ${ampm(p.start)}`} a ${hour(p.end)} ${ampm(p.end)}`
}

/** «2x1», «20 % de descuento»: solo para mostrar. */
export function promoRuleLabel(r: Promotion["rule"]): string {
  switch (r.kind) {
    case "percent": return r.value ? `${r.value} % de descuento` : "Descuento"
    case "twoForOne": return "2x1"
    case "freeItem": return "Producto gratis"
    case "fixedPrice": return r.value ? `Precio especial $${Math.trunc(r.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : "Precio especial"
    default: return "Promoción"
  }
}
