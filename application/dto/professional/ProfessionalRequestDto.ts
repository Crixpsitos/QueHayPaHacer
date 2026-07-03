import * as v from "valibot";

const CommonFields = {
  uid: v.pipe(v.string(), v.nonEmpty("uid is required")),
  username: v.pipe(v.string(), v.nonEmpty("El nombre de usuario es requerido")),
  brandName: v.pipe(v.string(), v.nonEmpty("El nombre de la marca o entidad es requerido")),
  description: v.pipe(v.string(), v.nonEmpty("La descripción es requerida")),
  phone: v.pipe(v.string(), v.nonEmpty("El teléfono de contacto es requerido")),
  website: v.optional(v.nullable(v.string()), null),
  previousRequestId: v.optional(v.nullable(v.string()), null),
  reapplyReason: v.optional(v.nullable(v.string()), null),
};

const OrganizerRequestSchema = v.object({
  ...CommonFields,
  professionalType: v.literal("organizer"),
  details: v.object({
    organizerType: v.picklist(["persona_natural", "empresa"], "Tipo de organizador inválido"),
    nit: v.optional(v.nullable(v.string()), null),
    eventCategories: v.pipe(
      v.array(v.string()),
      v.minLength(1, "Selecciona al menos una categoría de eventos"),
    ),
  }),
});

const BusinessRequestSchema = v.object({
  ...CommonFields,
  professionalType: v.literal("business"),
  details: v.object({
    businessCategory: v.picklist(
      [
        "bar",
        "cafe",
        "restaurante",
        "discoteca",
        "hotel",
        "teatro_cine",
        "museo_galeria",
        "parque_tematico",
        "gimnasio",
        "spa_bienestar",
        "salon_eventos",
        "tienda",
        "otro",
      ],
      "Categoría de negocio inválida",
    ),
    businessDescription: v.optional(v.nullable(v.string()), null),
    mapsLink: v.optional(v.nullable(v.string()), null),
    socialLink: v.optional(v.nullable(v.string()), null),
  }),
});

const GovernmentRequestSchema = v.object({
  ...CommonFields,
  professionalType: v.literal("government"),
  details: v.object({
    entityName: v.pipe(v.string(), v.nonEmpty("El nombre de la entidad es requerido")),
    department: v.pipe(v.string(), v.nonEmpty("La dependencia es requerida")),
    institutionalEmail: v.pipe(v.string(), v.email("Correo institucional inválido")),
  }),
});

export const SubmitProfessionalRequestSchema = v.variant("professionalType", [
  OrganizerRequestSchema,
  BusinessRequestSchema,
  GovernmentRequestSchema,
]);

export type SubmitProfessionalRequestDto = v.InferOutput<typeof SubmitProfessionalRequestSchema>;
