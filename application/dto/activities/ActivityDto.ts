import * as v from "valibot"
import { ACTIVITY_CATEGORIES, COMPANIONS, COMPANIONS_MAX, type ActivityCategory, type Companion } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { validateSchedule, type ActivitySchedule, type ScheduleRule, SCHEDULE_NOTE_MAX } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { EXTRA_UNITS, PRICE_UNITS, validateExtras, validatePriceOptions, type Extra, type PriceOption } from "@/domain/entities/activities/value-objects/Price"
import { normalizeCta, type Cta } from "@/domain/entities/activities/value-objects/Cta"
import { AGE_NOTE_MAX, DESCRIPTION_MAX, DESCRIPTION_MIN, DURATION_MAX, DURATION_MIN, MEETING_REFERENCES_MAX, MEETING_TEXT_MAX, TAGLINE_MAX, TITLE_MAX, TITLE_MIN, plainTextError, type Difficulty, type MeetingPoint } from "@/domain/entities/activities/Activity"
import { JOIN_CAPACITY_MAX } from "@/domain/entities/activities/activityJoin"
import { normalizeSections, type SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"

const text = (max: number, label: string) => v.pipe(v.string(`${label} inválido`), v.maxLength(max, `${label}: máximo ${max} caracteres`))
const Time = v.string("Hora inválida (usa HH:mm).")
const DateStr = v.string("Fecha inválida.")
const Weekdays = v.array(v.number("Día de la semana inválido."), "Elige al menos un día de la semana.")
const Times = { start: Time, end: v.optional(Time) }

const Rule = v.variant("kind", [
  v.object({ kind: v.literal("weekly"), weekdays: Weekdays, ...Times }),
  v.object({ kind: v.literal("everyNWeeks"), n: v.number("Cada cuántas semanas debe ser un número."), anchorDate: DateStr, weekdays: Weekdays, ...Times }),
  v.object({ kind: v.literal("monthlyNth"), nth: v.union([v.number(), v.literal("last")], "La semana del mes debe ser 1, 2, 3, 4 o la última."), weekday: v.number("Día de la semana inválido."), ...Times }),
  v.object({ kind: v.literal("monthlyDay"), dayOfMonth: v.number("El día del mes debe estar entre 1 y 31."), ...Times }),
  v.object({ kind: v.literal("dates"), dates: v.array(DateStr, "Agrega al menos una fecha."), ...Times }),
  v.object({ kind: v.literal("always"), start: v.optional(Time), end: v.optional(Time) }),
  v.object({ kind: v.literal("byAppointment") }),
])

const Schedule = v.object({
  rules: v.array(Rule, "Agrega al menos una regla de horario."),
  validFrom: v.optional(DateStr),
  validUntil: v.optional(DateStr),
  skipDates: v.optional(v.array(DateStr, "Fechas de excepción inválidas."), []),
  note: v.optional(text(SCHEDULE_NOTE_MAX, "La nota del horario")),
  requiresReservation: v.optional(v.boolean(), false),
})

const GEO_MSG = "La ubicación del punto de encuentro es inválida."
const Money = v.number("El precio debe ser un número entero en pesos.")

const ActivityInputSchema = v.object({
  title: v.pipe(v.string("El título es obligatorio."), v.trim(), v.minLength(TITLE_MIN, `El título debe tener entre ${TITLE_MIN} y ${TITLE_MAX} caracteres.`), v.maxLength(TITLE_MAX, `El título debe tener entre ${TITLE_MIN} y ${TITLE_MAX} caracteres.`)),
  tagline: v.optional(text(TAGLINE_MAX, "El gancho"), ""),
  description: v.pipe(v.string("La descripción es obligatoria."), v.trim(), v.minLength(DESCRIPTION_MIN, `La descripción debe tener entre ${DESCRIPTION_MIN} y ${DESCRIPTION_MAX} caracteres.`), v.maxLength(DESCRIPTION_MAX, `La descripción debe tener entre ${DESCRIPTION_MIN} y ${DESCRIPTION_MAX} caracteres.`)),
  siteId: v.optional(v.nullable(v.pipe(v.string("Sitio inválido."), v.minLength(1, "Sitio inválido."), v.maxLength(128, "Sitio inválido."))), null),
  category: v.picklist(ACTIVITY_CATEGORIES.map((c) => c.slug) as [ActivityCategory, ...ActivityCategory[]], "Elige una categoría válida."),
  companions: v.optional(v.pipe(v.array(v.picklist(COMPANIONS, "Opción de \"con quién\" inválida."), "Opciones de \"con quién\" inválidas."), v.maxLength(COMPANIONS_MAX, "Demasiadas opciones de \"con quién\".")), []),
  difficulty: v.optional(v.nullable(v.picklist(["easy", "medium", "hard"], "Dificultad inválida.")), null),
  durationMinutes: v.optional(v.nullable(v.pipe(v.number("La duración debe ser un número."), v.integer("La duración debe ser un número entero."), v.minValue(DURATION_MIN, "La duración debe estar entre 15 minutos y 24 horas."), v.maxValue(DURATION_MAX, "La duración debe estar entre 15 minutos y 24 horas."))), null),
  ageNote: v.optional(text(AGE_NOTE_MAX, "La nota de edad"), ""),
  meetingPoint: v.object(
    {
      mode: v.picklist(["fixed", "sharedAfterJoining", "varies"], "El punto de encuentro tiene un modo inválido."),
      text: v.optional(text(MEETING_TEXT_MAX, "El punto de encuentro"), ""),
      references: v.optional(text(MEETING_REFERENCES_MAX, "Las referencias del punto de encuentro"), ""),
      geo: v.optional(v.nullable(v.object({ lat: v.pipe(v.number(GEO_MSG), v.minValue(-90, GEO_MSG), v.maxValue(90, GEO_MSG)), lng: v.pipe(v.number(GEO_MSG), v.minValue(-180, GEO_MSG), v.maxValue(180, GEO_MSG)) }, GEO_MSG)), null),
    },
    "El punto de encuentro es obligatorio.",
  ),
  schedule: Schedule,
  priceOptions: v.array(v.object({ label: v.string("Nombre inválido."), amountCop: Money, unit: v.picklist(PRICE_UNITS, "Unidad de precio inválida."), includes: v.optional(v.array(v.string()), []), note: v.optional(v.string()) }), "Agrega al menos una opción de precio."),
  extras: v.optional(v.array(v.object({ label: v.string("Nombre inválido."), amountCop: Money, unit: v.picklist(EXTRA_UNITS, "Unidad de extra inválida."), note: v.optional(v.string()) }), "Extras inválidos."), []),
  sections: v.optional(v.array(v.unknown()), []),
  cta: v.optional(v.nullable(v.object({ kind: v.string(), value: v.string(), label: v.optional(v.string()) })), null),
  join: v.optional(v.nullable(v.object({ capacity: v.nullable(v.pipe(v.number("El cupo debe ser un número."), v.integer("El cupo debe ser un número entero."), v.minValue(1, `El cupo debe estar entre 1 y ${JOIN_CAPACITY_MAX}.`), v.maxValue(JOIN_CAPACITY_MAX, `El cupo debe estar entre 1 y ${JOIN_CAPACITY_MAX}.`))) }, "Los datos de inscripción son inválidos.")), null),
})

/** Lo que el asistente envía para crear o editar (sin id, dueño, estado ni medios: eso lo pone el servidor). */
export interface ActivityInput {
  title: string
  tagline: string
  description: string
  siteId: string | null
  category: ActivityCategory
  companions: Companion[]
  difficulty: Difficulty | null
  durationMinutes: number | null
  ageNote: string
  meetingPoint: MeetingPoint
  schedule: ActivitySchedule
  priceOptions: PriceOption[]
  extras: Extra[]
  sections: SiteSection[]
  cta: Cta | null
  /** Cupo por salida (null = sin tope). `join: null` = la actividad no recibe inscripciones. */
  join: { capacity: number | null } | null
}

export type ParseResult = { ok: true; value: ActivityInput } | { ok: false; error: string }

/** Valida la forma (valibot) y después las reglas del dominio. Nunca lanza; el error es el primer mensaje en español. */
export function parseActivityInput(raw: unknown): ParseResult {
  const parsed = v.safeParse(ActivityInputSchema, raw)
  if (!parsed.success) return { ok: false, error: parsed.issues[0]?.message ?? "Datos inválidos." }
  const d = parsed.output
  const text = plainTextError("El título", d.title) ?? plainTextError("El gancho", d.tagline) ?? plainTextError("La descripción", d.description) ?? plainTextError("El punto de encuentro", `${d.meetingPoint.text} ${d.meetingPoint.references}`)
  if (text) return { ok: false, error: text }
  const schedule = { ...d.schedule, rules: d.schedule.rules as ScheduleRule[] } as ActivitySchedule
  const priceOptions = d.priceOptions.map((p) => ({ ...p, label: p.label.trim() })) as PriceOption[]
  const extras = d.extras.map((x) => ({ ...x, label: x.label.trim() })) as Extra[]
  const error = validateSchedule(schedule) ?? validatePriceOptions(priceOptions) ?? validateExtras(extras)
  if (error) return { ok: false, error }
  let cta: Cta | null = null
  if (d.cta) {
    const c = normalizeCta(d.cta)
    if (!c.ok) return { ok: false, error: c.error }
    cta = c.cta
  }
  return {
    ok: true,
    value: {
      title: d.title,
      tagline: d.tagline.trim(),
      description: d.description,
      siteId: d.siteId,
      category: d.category,
      companions: d.companions,
      difficulty: d.difficulty,
      durationMinutes: d.durationMinutes,
      ageNote: d.ageNote.trim(),
      meetingPoint: { mode: d.meetingPoint.mode, text: d.meetingPoint.text.trim(), references: d.meetingPoint.references.trim(), geo: d.meetingPoint.geo },
      schedule,
      priceOptions,
      extras,
      sections: normalizeSections(d.sections),
      cta,
      join: d.join ? { capacity: d.join.capacity } : null,
    },
  }
}
