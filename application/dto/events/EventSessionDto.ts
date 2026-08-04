import * as v from "valibot";
import { RichTextWithLengthSchema, getTiptapPlainText } from "./EventDto";

/**
 * Duración máxima de una sesión. Una sesión = una ocurrencia continua (máx. un día).
 * Para días adicionales se crea otra fecha (ese es el sentido de multi-date).
 * ponytail: si querés acortar (p.ej. 12h), cambia solo esta constante.
 */
export const MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_SESSION_DURATION_MSG =
  "Una sesión no puede durar más de 24 horas. Crea otra fecha para días adicionales.";

// ─── Schemas compartidos ───────────────────────────────────────────────────────

const SessionCoverSourceSchema = v.union([
  v.literal("own"),
  v.literal("parent"),
  v.object({ sessionId: v.pipe(v.string(), v.nonEmpty()) }),
]);

const SessionLocationSchema = v.object({
  country: v.object({
    isoCode: v.pipe(v.string(), v.nonEmpty("El país es requerido")),
    name: v.string(),
    slug: v.string(),
  }),
  department: v.object({
    isoCode: v.pipe(v.string(), v.nonEmpty("El departamento es requerido")),
    name: v.string(),
    slug: v.string(),
  }),
  city: v.object({
    name: v.pipe(v.string(), v.nonEmpty("La ciudad es requerida")),
    slug: v.string(),
  }),
  venue: v.pipe(v.string(), v.nonEmpty("El espacio es requerido")),
  address: v.pipe(v.string(), v.nonEmpty("La dirección es requerida")),
  moreInfo: v.optional(v.string()),
  coordinates: v.object({
    lat: v.number("La latitud es requerida"),
    lng: v.number("La longitud es requerida"),
  }),
  siteId: v.optional(v.nullable(v.string())),
});

const SessionPriceSchema = v.object({
  isFree: v.boolean(),
  amount: v.number(),
  currency: v.string(),
});

// ─── Schema completo de sesión (para publicar) ────────────────────────────────

const sessionBodyObject = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty("El título es requerido"),
    v.maxLength(80, "Máximo 80 caracteres"),
  ),
  shortDescription: v.pipe(
    v.string(),
    v.nonEmpty("La sinopsis es requerida"),
    v.maxLength(150, "Máximo 150 caracteres"),
  ),
  description: RichTextWithLengthSchema,
  coverSource: SessionCoverSourceSchema,
  mainImage: v.optional(
    v.object({
      url: v.pipe(v.string(), v.url("URL de imagen inválida")),
      path: v.optional(v.string()),
      status: v.optional(
        v.picklist(["processing", "ready", "error"] as const),
      ),
      temporaryUrl: v.optional(v.string()),
    }),
  ),
  media: v.optional(v.array(v.any())),
  location: SessionLocationSchema,
  startDate: v.pipe(v.string(), v.nonEmpty("La fecha de inicio es requerida")),
  endDate: v.pipe(v.string(), v.nonEmpty("La fecha de fin es requerida")),
  registrationType: v.picklist([
    "none",
    "internal",
    "external",
    "form",
  ] as const),
  externalUrl: v.optional(v.string()),
  capacity: v.optional(v.number()),
  requiresAttendance: v.optional(v.boolean()),
  registrationEventForm: v.optional(
    v.object({ fields: v.array(v.any()) }),
    { fields: [] },
  ),
  price: SessionPriceSchema,
  status: v.picklist(["draft", "published", "cancelled", "ended"] as const),
});

export const SessionSchema = v.pipe(
  sessionBodyObject,
  v.forward(
    v.check(
      (data) => new Date(data.endDate) >= new Date(data.startDate),
      "La fecha de fin no puede ser anterior a la fecha de inicio.",
    ),
    ["endDate"],
  ),
  v.forward(
    v.check(
      (data) =>
        new Date(data.endDate).getTime() - new Date(data.startDate).getTime() <=
        MAX_SESSION_DURATION_MS,
      MAX_SESSION_DURATION_MSG,
    ),
    ["endDate"],
  ),
  v.forward(
    v.check(
      (data) =>
        data.registrationType !== "external" ||
        (!!data.externalUrl && data.externalUrl.trim().length > 0),
      "La URL externa es obligatoria cuando el tipo de registro es externo.",
    ),
    ["externalUrl"],
  ),
  v.forward(
    v.check(
      (data) =>
        data.price.isFree ||
        (data.price.amount != null && data.price.amount > 0),
      "El precio debe ser mayor a 0.",
    ),
    ["price"],
  ),
);

// ─── Schema para el formulario de sesión (título/sinopsis/descripción son requeridos al publicar) ──

export const FormSessionSchema = v.pipe(
  v.object({
  id: v.optional(v.string()),
  eventId: v.optional(v.string()),
  title: v.pipe(
    v.string("El título es requerido"),
    v.nonEmpty("El título es requerido"),
    v.maxLength(80, "Máximo 80 caracteres"),
  ),
  shortDescription: v.pipe(
    v.string("La sinopsis es requerida"),
    v.nonEmpty("La sinopsis es requerida"),
    v.maxLength(150, "Máximo 150 caracteres"),
  ),
  // description tolerante al tipo (undefined / doc vacío) con mensaje limpio.
  description: v.pipe(
    v.any(),
    v.check(
      (d) => getTiptapPlainText(d).trim().length > 0,
      "La descripción es requerida",
    ),
  ),
  coverSource: v.optional(SessionCoverSourceSchema),
  mainImage: v.optional(v.any()),
  media: v.optional(v.array(v.any())),
  location: v.optional(
    v.object({
      country: v.optional(
        v.object({ isoCode: v.string(), name: v.string(), slug: v.string() }),
      ),
      department: v.optional(
        v.object({ isoCode: v.string(), name: v.string(), slug: v.string() }),
      ),
      city: v.optional(v.object({ name: v.string(), slug: v.string() })),
      venue: v.optional(v.string()),
      address: v.optional(v.string()),
      moreInfo: v.optional(v.string()),
      coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
      siteId: v.optional(v.nullable(v.string())),
    }),
  ),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  registrationType: v.optional(
    v.picklist(["none", "internal", "external", "form"] as const),
  ),
  externalUrl: v.optional(v.string()),
  capacity: v.optional(v.number()),
  requiresAttendance: v.optional(v.boolean()),
  registrationEventForm: v.optional(
    v.object({ fields: v.optional(v.array(v.any())) }),
  ),
  price: v.optional(
    v.object({
      isFree: v.optional(v.boolean()),
      amount: v.optional(v.number()),
      currency: v.optional(v.string()),
    }),
  ),
  status: v.optional(
    v.picklist(["draft", "published", "cancelled", "ended"] as const),
  ),
  }),
  v.forward(
    v.check((data) => {
      if (!data.startDate || !data.endDate) return true;
      return (
        new Date(data.endDate).getTime() - new Date(data.startDate).getTime() <=
        MAX_SESSION_DURATION_MS
      );
    }, MAX_SESSION_DURATION_MSG),
    ["endDate"],
  ),
);

export type FormSessionDto = v.InferOutput<typeof FormSessionSchema>;
export type SessionDto = v.InferOutput<typeof SessionSchema>;
