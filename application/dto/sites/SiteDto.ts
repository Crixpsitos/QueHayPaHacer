import { SITE_KINDS, SITE_PUBLISHED_AS_FORM } from "@/domain/entities/sites/value-objects/SiteListing"
import * as v from "valibot"
import { SITE_TIP_IDS, TIP_NOTE_MAX } from "@/domain/entities/sites/value-objects/SiteRecommendations"
import type { SiteCategory, WeekDay } from "@/presentation/sites/view-models/SiteFormViewModel"
import { HOLIDAY_POLICIES, RAIN_NOTE_MAX, RAIN_POLICIES } from "@/domain/entities/sites/value-objects/SiteOpeningPolicy"

const SITE_CATEGORIES = [
  "cafe", "restaurant", "bar", "discotheque", "mall", "park", "museum", "hostel",
  "hotel", "cultural", "viewpoint", "gym", "spa", "theater", "other",
] as const satisfies readonly SiteCategory[]

const WEEK_DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const satisfies readonly WeekDay[]

const text = (max: number, label: string) =>
  v.pipe(v.string(), v.maxLength(max, `${label}: máximo ${max} caracteres`))

// Solo http(s) o vacío: estos enlaces se renderizan como href en el detalle público.
const OptionalHttpUrl = v.pipe(
  v.string(),
  v.maxLength(500, "Enlace demasiado largo"),
  v.check((value) => {
    if (value === "") return true
    try {
      return ["http:", "https:"].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }, "Los enlaces deben empezar por http:// o https://"),
)

const Coordinates = (msg: string) =>
  v.object(
    {
      latitude: v.pipe(v.number(msg), v.minValue(-90, msg), v.maxValue(90, msg)),
      longitude: v.pipe(v.number(msg), v.minValue(-180, msg), v.maxValue(180, msg)),
    },
    msg,
  )

const Time = v.pipe(v.string(), v.regex(/^(\d{2}:\d{2})?$/, "Horario inválido"))

const OpeningPolicy = v.object({
  holidays: v.optional(
    v.pipe(
      v.object({ policy: v.picklist(HOLIDAY_POLICIES), open: v.optional(Time), close: v.optional(Time) }),
      v.check((h) => h.policy !== "custom" || (!!h.open && !!h.close), "Indica el horario de los festivos"),
    ),
  ),
  rain: v.optional(v.object({ policy: v.picklist(RAIN_POLICIES), note: v.optional(text(RAIN_NOTE_MAX, "Nota de lluvia")) })),
})

const fields = {
  name: text(120, "Nombre"),
  description: text(5000, "Descripción"),
  address: text(300, "Dirección"),
  city: text(100, "Ciudad"),
  region: text(100, "Departamento"),
  country: text(100, "País"),
  category: v.union([v.literal(""), v.picklist(SITE_CATEGORIES)], "Categoría inválida"),
  coordinates: v.nullable(Coordinates("Ubicación inválida")),
  media: v.pipe(v.array(v.any()), v.maxLength(30, "Máximo 30 archivos")),
  schedule: v.record(v.picklist(WEEK_DAYS), v.object({ open: Time, close: Time, closed: v.boolean() })),
  socialMedia: v.optional(
    v.object({
      instagram: v.optional(OptionalHttpUrl),
      facebook: v.optional(OptionalHttpUrl),
      tiktok: v.optional(OptionalHttpUrl),
      twitter: v.optional(OptionalHttpUrl),
      website: v.optional(OptionalHttpUrl),
    }),
  ),
  temporarilyClosed: v.optional(v.object({ isClosed: v.boolean(), reason: text(300, "Motivo de cierre") })),
  openingPolicy: v.optional(OpeningPolicy),
  recommendations: v.optional(v.object({ tips: v.array(v.picklist(SITE_TIP_IDS)), note: v.optional(text(TIP_NOTE_MAX, "Nota de recomendaciones")) })),
  bookingUrl: v.optional(OptionalHttpUrl),
  kind: v.optional(v.picklist(SITE_KINDS)),
  // "qhpa" no está: lo decide el servidor, nunca el cliente.
  publishedAs: v.optional(v.picklist(SITE_PUBLISHED_AS_FORM)),
}

/** Borrador: mismos límites de formato, pero nombre/categoría/ubicación pueden faltar. */
export const SiteDraftSchema = v.object(fields)

/** Publicar / editar: además exige nombre, categoría y ubicación. */
export const SiteSchema = v.object({
  ...fields,
  name: v.pipe(v.string(), v.trim(), v.nonEmpty("Nombre requerido"), v.maxLength(120, "Nombre: máximo 120 caracteres")),
  category: v.picklist(SITE_CATEGORIES, "Categoría requerida"),
  coordinates: Coordinates("Ubicación requerida"),
})

/** Primer mensaje de error en español, o null si el formulario es válido. */
export function validateSiteForm(schema: typeof SiteSchema | typeof SiteDraftSchema, form: unknown): string | null {
  const r = v.safeParse(schema, form)
  return r.success ? null : r.issues[0].message
}
