import type { Activity, Difficulty } from "@/domain/entities/activities/Activity"
import { DESCRIPTION_MAX, DESCRIPTION_MIN, TITLE_MAX, TITLE_MIN, plainTextError } from "@/domain/entities/activities/Activity"
import type { ActivityCategory, Companion } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { describeSchedule, validateSchedule, SCHEDULE_RULES_MAX, type ActivitySchedule, type ScheduleRule, type Weekday } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { bogotaDateIso, occurrencesBetween } from "@/domain/entities/activities/value-objects/occurrences"
import { EXTRAS_MAX, INCLUDES_MAX, PRICE_OPTIONS_MAX, formatCop, validateExtras, validatePriceOptions, type Extra, type ExtraUnit, type PriceOption, type PriceUnit } from "@/domain/entities/activities/value-objects/Price"
import { JOIN_CAPACITY_MAX, isPaidActivity, validatePayInstructions } from "@/domain/entities/activities/activityJoin"
import { normalizeCta, type CtaKind } from "@/domain/entities/activities/value-objects/Cta"
import type { SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"

/**
 * Estado del asistente de creación (todo texto, como llega de los inputs) y su conversión a la entrada que valida
 * el servidor. Lógica pura: se prueba sin navegador. La validación real vuelve a correr en el servidor.
 */
export type Freq = "weekly" | "everyNWeeks" | "monthlyNth" | "monthlyDay" | "dates" | "always" | "byAppointment"

export interface FormRule {
  freq: Freq
  weekdays: number[]
  start: string
  end: string
  n: string
  anchorDate: string
  nth: string
  weekday: number
  dayOfMonth: string
  dates: string[]
}

export interface FormPrice {
  label: string
  /** "40.000" */
  amount: string
  unit: PriceUnit
  includes: string[]
  note: string
}

export interface FormExtra {
  label: string
  amount: string
  unit: ExtraUnit
  note: string
}

export interface ActivityForm {
  kind: "global" | "site"
  siteId: string | null
  title: string
  tagline: string
  description: string
  category: ActivityCategory | ""
  companions: Companion[]
  difficulty: Difficulty | ""
  durationMinutes: string
  ageNote: string
  meetingMode: "fixed" | "sharedAfterJoining" | "varies"
  meetingText: string
  meetingReferences: string
  rules: FormRule[]
  validFrom: string
  validUntil: string
  skipDates: string[]
  requiresReservation: boolean
  scheduleNote: string
  priceOptions: FormPrice[]
  extras: FormExtra[]
  ctaKind: CtaKind | ""
  ctaValue: string
  ctaLabel: string
  /** Reservas en QHPA ("Unirme"). */
  joinEnabled: boolean
  /** Vacío = sin tope. */
  joinCapacity: string
  payInstructions: string
  sections: SiteSection[]
}

// ── Dinero ──

/** "40.000" → 40000; vacío o con coma/letras → NaN. */
export function parseMoney(s: string): number {
  const t = s.trim().replace(/\./g, "")
  return /^\d+$/.test(t) ? Number(t) : Number.NaN
}
export const moneyToString = (n: number): string => formatCop(n).slice(1)

// ── Operaciones sobre listas (inmutables) ──

export const blankRule = (): FormRule => ({ freq: "weekly", weekdays: [], start: "", end: "", n: "2", anchorDate: "", nth: "1", weekday: 6, dayOfMonth: "15", dates: [] })
export const blankPrice = (): FormPrice => ({ label: "", amount: "", unit: "persona", includes: [], note: "" })
export const blankExtra = (): FormExtra => ({ label: "", amount: "", unit: "persona", note: "" })

export const emptyForm = (): ActivityForm => ({
  kind: "global", siteId: null, title: "", tagline: "", description: "", category: "", companions: [], difficulty: "", durationMinutes: "", ageNote: "",
  meetingMode: "fixed", meetingText: "", meetingReferences: "",
  rules: [blankRule()], validFrom: "", validUntil: "", skipDates: [], requiresReservation: false, scheduleNote: "",
  priceOptions: [blankPrice()], extras: [], ctaKind: "", ctaValue: "", ctaLabel: "", joinEnabled: false, joinCapacity: "", payInstructions: "", sections: [],
})

export const addRule = (rules: FormRule[]): FormRule[] => (rules.length >= SCHEDULE_RULES_MAX ? rules : [...rules, blankRule()])
/** Siempre queda al menos una regla. */
export const removeRule = (rules: FormRule[], i: number): FormRule[] => (rules.length <= 1 ? rules : rules.filter((_, j) => j !== i))
export const updateRule = (rules: FormRule[], i: number, patch: Partial<FormRule>): FormRule[] => rules.map((r, j) => (j === i ? { ...r, ...patch } : r))
export const toggleWeekday = (days: number[], d: number): number[] => (days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b))

export const addPrice = (p: FormPrice[]): FormPrice[] => (p.length >= PRICE_OPTIONS_MAX ? p : [...p, blankPrice()])
export const removePrice = (p: FormPrice[], i: number): FormPrice[] => (p.length <= 1 ? p : p.filter((_, j) => j !== i))
export const updatePrice = (p: FormPrice[], i: number, patch: Partial<FormPrice>): FormPrice[] => p.map((x, j) => (j === i ? { ...x, ...patch } : x))
export const addInclude = (inc: string[], item: string): string[] => {
  const t = item.trim()
  return !t || inc.length >= INCLUDES_MAX || inc.includes(t) ? inc : [...inc, t]
}
export const removeInclude = (inc: string[], i: number): string[] => inc.filter((_, j) => j !== i)
export const addExtra = (e: FormExtra[]): FormExtra[] => (e.length >= EXTRAS_MAX ? e : [...e, blankExtra()])
export const removeExtra = (e: FormExtra[], i: number): FormExtra[] => e.filter((_, j) => j !== i)
export const updateExtra = (e: FormExtra[], i: number, patch: Partial<FormExtra>): FormExtra[] => e.map((x, j) => (j === i ? { ...x, ...patch } : x))

// ── Formulario → entrada del servidor ──

const optional = (v: string) => (v.trim() ? { value: v.trim() } : null)

function ruleToRaw(r: FormRule): Record<string, unknown> {
  const times = { start: r.start, ...(r.end ? { end: r.end } : {}) }
  switch (r.freq) {
    case "weekly": return { kind: "weekly", weekdays: r.weekdays, ...times }
    case "everyNWeeks": return { kind: "everyNWeeks", n: Number(r.n), anchorDate: r.anchorDate, weekdays: r.weekdays, ...times }
    case "monthlyNth": return { kind: "monthlyNth", nth: r.nth === "last" ? "last" : Number(r.nth), weekday: r.weekday, ...times }
    case "monthlyDay": return { kind: "monthlyDay", dayOfMonth: Number(r.dayOfMonth), ...times }
    case "dates": return { kind: "dates", dates: r.dates, ...times }
    case "always": return { kind: "always", ...(r.start ? times : {}) }
    case "byAppointment": return { kind: "byAppointment" }
  }
}

export function scheduleFromForm(f: ActivityForm): ActivitySchedule {
  return {
    rules: f.rules.map(ruleToRaw) as unknown as ScheduleRule[],
    ...(f.validFrom ? { validFrom: f.validFrom } : {}),
    ...(f.validUntil ? { validUntil: f.validUntil } : {}),
    skipDates: f.skipDates,
    ...(f.scheduleNote.trim() ? { note: f.scheduleNote.trim() } : {}),
    requiresReservation: f.requiresReservation,
  }
}

const priceFromForm = (f: ActivityForm): PriceOption[] =>
  f.priceOptions.map((p) => ({ label: p.label, amountCop: parseMoney(p.amount), unit: p.unit, includes: p.includes, ...(p.note.trim() ? { note: p.note.trim() } : {}) }))
const extrasFromForm = (f: ActivityForm): Extra[] =>
  f.extras.map((x) => ({ label: x.label, amountCop: parseMoney(x.amount), unit: x.unit, ...(x.note.trim() ? { note: x.note.trim() } : {}) }))

/** Lo que se envía a `saveActivityAction` (el servidor vuelve a validar todo con `parseActivityInput`). */
export function toRawInput(f: ActivityForm): unknown {
  return {
    title: f.title,
    tagline: f.tagline,
    description: f.description,
    siteId: f.kind === "site" ? f.siteId : null,
    category: f.category,
    companions: f.companions,
    difficulty: f.difficulty || null,
    durationMinutes: f.durationMinutes.trim() ? Number(f.durationMinutes) : null,
    ageNote: f.ageNote,
    meetingPoint: { mode: f.meetingMode, text: f.meetingText, references: f.meetingReferences, geo: null },
    schedule: scheduleFromForm(f),
    priceOptions: priceFromForm(f),
    extras: extrasFromForm(f),
    sections: f.sections,
    cta: f.ctaKind && optional(f.ctaValue) ? { kind: f.ctaKind, value: f.ctaValue, ...(optional(f.ctaLabel) ? { label: f.ctaLabel } : {}) } : null,
    join: f.joinEnabled ? { capacity: f.joinCapacity.trim() ? Number(f.joinCapacity) : null, payInstructions: f.payInstructions } : null,
  }
}

// ── Actividad → formulario (editar) ──

function ruleFromDomain(r: ScheduleRule): FormRule {
  const base = blankRule()
  switch (r.kind) {
    case "weekly": return { ...base, freq: "weekly", weekdays: [...r.weekdays], start: r.start, end: r.end ?? "" }
    case "everyNWeeks": return { ...base, freq: "everyNWeeks", n: String(r.n), anchorDate: r.anchorDate, weekdays: [...r.weekdays], start: r.start, end: r.end ?? "" }
    case "monthlyNth": return { ...base, freq: "monthlyNth", nth: String(r.nth), weekday: r.weekday, start: r.start, end: r.end ?? "" }
    case "monthlyDay": return { ...base, freq: "monthlyDay", dayOfMonth: String(r.dayOfMonth), start: r.start, end: r.end ?? "" }
    case "dates": return { ...base, freq: "dates", dates: [...r.dates], start: r.start, end: r.end ?? "" }
    case "always": return { ...base, freq: "always", start: r.start ?? "", end: r.end ?? "" }
    case "byAppointment": return { ...base, freq: "byAppointment" }
  }
}

export function formFromActivity(a: Activity): ActivityForm {
  return {
    kind: a.kind, siteId: a.siteId, title: a.title, tagline: a.tagline, description: a.description, category: a.category, companions: [...a.companions],
    difficulty: a.difficulty ?? "", durationMinutes: a.durationMinutes === null ? "" : String(a.durationMinutes), ageNote: a.ageNote,
    meetingMode: a.meetingPoint.mode, meetingText: a.meetingPoint.text, meetingReferences: a.meetingPoint.references,
    rules: a.schedule.rules.map(ruleFromDomain), validFrom: a.schedule.validFrom ?? "", validUntil: a.schedule.validUntil ?? "", skipDates: [...a.schedule.skipDates],
    requiresReservation: a.schedule.requiresReservation, scheduleNote: a.schedule.note ?? "",
    priceOptions: a.priceOptions.map((p) => ({ label: p.label, amount: moneyToString(p.amountCop), unit: p.unit, includes: [...p.includes], note: p.note ?? "" })),
    extras: a.extras.map((x) => ({ label: x.label, amount: moneyToString(x.amountCop), unit: x.unit, note: x.note ?? "" })),
    ctaKind: a.cta?.kind ?? "", ctaValue: a.cta?.value ?? "", ctaLabel: a.cta?.label ?? "",
    joinEnabled: a.join !== null, joinCapacity: a.join?.capacity == null ? "" : String(a.join.capacity), payInstructions: a.join?.payInstructions ?? "",
    sections: a.sections.map((s) => ({ ...s })),
  }
}

// ── Vista previa del horario ──

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d} ${MONTHS[m - 1]}`
}

export function previewSchedule(f: ActivityForm, now: Date): { text: string; next: string[]; error?: string } {
  const s = scheduleFromForm(f)
  const error = validateSchedule(s)
  if (error) return { text: "", next: [], error }
  const today = bogotaDateIso(now)
  const to = new Date(Date.parse(`${today}T00:00:00Z`) + 400 * 86_400_000).toISOString().slice(0, 10)
  const upcoming = occurrencesBetween(s, today, to).filter((o) => (o.endsAt ?? o.startsAt ?? new Date(Date.parse(`${o.date}T00:00:00Z`) + 29 * 3_600_000)).getTime() >= now.getTime())
  const isDaily = s.rules.some((r) => r.kind === "always")
  return { text: describeSchedule(s), next: isDaily ? [] : [...new Set(upcoming.map((o) => o.date))].slice(0, 5).map(shortDate) }
}

// ── Validación por paso (el servidor repite todo) ──

export interface StepContext {
  /** Cantidad de portadas ya subidas (paso 6). */
  coverCount?: number
}

export function stepError(step: number, f: ActivityForm, ctx: StepContext = {}): string | null {
  switch (step) {
    case 1:
      return f.kind === "site" && !f.siteId ? "Elige el sitio de esta actividad." : null
    case 2: {
      const title = f.title.trim()
      const desc = f.description.trim()
      if (title.length < TITLE_MIN || title.length > TITLE_MAX) return `El título debe tener entre ${TITLE_MIN} y ${TITLE_MAX} caracteres.`
      if (desc.length < DESCRIPTION_MIN || desc.length > DESCRIPTION_MAX) return `La descripción debe tener entre ${DESCRIPTION_MIN} y ${DESCRIPTION_MAX} caracteres.`
      if (!f.category) return "Elige una categoría."
      return plainTextError("El título", title) ?? plainTextError("El gancho", f.tagline) ?? plainTextError("La descripción", desc)
    }
    case 3:
      return validateSchedule(scheduleFromForm(f))
    case 4:
      return validatePriceOptions(priceFromForm(f)) ?? validateExtras(extrasFromForm(f))
    case 5:
      if (f.kind === "global" && f.meetingMode === "fixed" && f.meetingText.trim().length < 3) return "Escribe el punto de encuentro (o elige que se dice en el grupo)."
      return plainTextError("El punto de encuentro", `${f.meetingText} ${f.meetingReferences}`)
    case 6:
      if (ctx.coverCount === undefined || ctx.coverCount === 1) return null
      return ctx.coverCount === 0 ? "Sube al menos una foto: será la portada." : "Elige una sola foto de portada."
    case 7: {
      if (f.joinEnabled) {
        const cap = f.joinCapacity.trim()
        if (cap && (!/^\d+$/.test(cap) || Number(cap) < 1 || Number(cap) > JOIN_CAPACITY_MAX)) return `El cupo debe ser un número entero entre 1 y ${JOIN_CAPACITY_MAX}.`
        const pay = f.payInstructions.trim()
        if (isPaidActivity(f.priceOptions.map((p) => ({ amountCop: parseMoney(p.amount) || 0 }))) && !pay) return "Cuéntale a la gente cómo se paga (por ejemplo, tu Nequi)."
        const e = validatePayInstructions(pay)
        if (e) return e
      }
      if (!f.ctaKind || !f.ctaValue.trim()) return null
      const r = normalizeCta({ kind: f.ctaKind, value: f.ctaValue, label: f.ctaLabel })
      return r.ok ? null : r.error
    }
    default:
      return null
  }
}

export const WIZARD_STEPS = 9
export type { Weekday }
