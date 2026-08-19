import * as v from "valibot";

const CommonFields = {
  uid: v.pipe(v.string(), v.nonEmpty("uid is required")),
  username: v.pipe(
    v.string(),
    v.nonEmpty("El nombre comercial es requerido"),
    v.minLength(3, "Debe tener al menos 3 caracteres"),
    v.maxLength(30, "Debe tener máximo 30 caracteres"),
    v.regex(/^[a-zA-Z0-9_.-]+$/, "Solo letras, números, guiones bajos, puntos y guiones"),
  ),
  brandName: v.pipe(v.string(), v.nonEmpty("El nombre de la marca o entidad es requerido")),
  description: v.pipe(v.string(), v.nonEmpty("La descripción es requerida")),
  phone: v.pipe(v.string(), v.nonEmpty("El teléfono de contacto es requerido")),
  website: v.optional(v.nullable(v.string()), null),
  previousRequestId: v.optional(v.nullable(v.string()), null),
  reapplyReason: v.optional(v.nullable(v.string()), null),
};

const OrganizerRequestSchema = v.object({
  ...CommonFields,
  // Sobreescribe description con validación de longitud específica para organizador
  description: v.pipe(
    v.string(),
    v.nonEmpty("La descripción es requerida"),
    v.minLength(20, "Cuéntanos un poco más (mínimo 20 caracteres)"),
    v.maxLength(500, "La descripción es demasiado larga (máximo 500 caracteres)"),
  ),
  professionalType: v.literal("organizer"),
  details: v.object({
    organizerType: v.picklist(["natural_person", "organization"], "Tipo de organizador inválido"),
    organizationName: v.optional(v.nullable(v.string()), null),
    nit: v.optional(v.nullable(v.string()), null),
    eventCategories: v.pipe(
      v.array(v.string()),
      v.minLength(1, "Selecciona al menos una categoría de eventos"),
    ),
  }),
});

const BusinessRequestSchema = v.object({
  ...CommonFields,
  // Descripción mínima de 20 chars para tener contexto suficiente del negocio
  description: v.pipe(
    v.string(),
    v.nonEmpty("La descripción es requerida"),
    v.minLength(20, "Cuéntanos un poco más (mínimo 20 caracteres)"),
    v.maxLength(500, "La descripción es demasiado larga (máximo 500 caracteres)"),
  ),
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
    nit: v.optional(v.nullable(v.string()), null),
    businessPhone: v.optional(v.nullable(v.string()), null),
  }),
});

const GovernmentRequestSchema = v.object({
  ...CommonFields,
  description: v.pipe(
    v.string(),
    v.nonEmpty("La descripción es requerida"),
    v.minLength(20, "Cuéntanos un poco más (mínimo 20 caracteres)"),
    v.maxLength(500, "La descripción es demasiado larga (máximo 500 caracteres)"),
  ),
  professionalType: v.literal("government"),
  details: v.object({
    entityName: v.pipe(
      v.string(),
      v.nonEmpty("El nombre de la entidad es requerido"),
      v.minLength(3, "Debe tener al menos 3 caracteres"),
      v.maxLength(100, "Debe tener máximo 100 caracteres"),
    ),
    department: v.pipe(
      v.string(),
      v.nonEmpty("La dependencia es requerida"),
      v.minLength(3, "Debe tener al menos 3 caracteres"),
      v.maxLength(100, "Debe tener máximo 100 caracteres"),
    ),
    institutionalEmail: v.pipe(v.string(), v.email("Correo institucional inválido")),
    institutionalPhone: v.pipe(v.string(), v.nonEmpty("El teléfono institucional es requerido")),
    mapsLink: v.optional(v.nullable(v.string()), null),
    nit: v.optional(v.nullable(v.string()), null),
  }),
});

export const SubmitProfessionalRequestSchema = v.variant("professionalType", [
  OrganizerRequestSchema,
  BusinessRequestSchema,
  GovernmentRequestSchema,
]);

export type SubmitProfessionalRequestDto = v.InferOutput<typeof SubmitProfessionalRequestSchema>;
