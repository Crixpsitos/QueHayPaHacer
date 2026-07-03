import * as v from "valibot";

const ImageSchema = v.object({
  url: v.optional(v.pipe(v.string(), v.url("Url de imagen inválida"))),
  path: v.optional(v.string()),
  width: v.optional(v.pipe(v.number(), v.minValue(0))),
  height: v.optional(v.pipe(v.number(), v.minValue(0))),
  alt: v.optional(v.string()),
});

// New simplified mainImage object schema: contains final url + storage path
const MainImageObjectSchema = v.object({
  url: v.pipe(v.string(), v.url("Url de imagen inválida")),
  path: v.optional(v.string()),
  status: v.optional(v.picklist(["processing", "ready", "error"] as const)),
  temporaryUrl: v.optional(v.string()),
});


const ImageVariantsSchema = v.object({
  type: v.literal("image"),
  data: v.object({
    status: v.optional(v.picklist(["processing", "ready", "error"] as const)),
    temporaryUrl: v.optional(v.string()),
    ...ImageSchema.entries,
  }),
});

const VideoSchema = v.object({
  type: v.literal("video"),
  data: v.object({
    status: v.optional(v.picklist(["processing", "ready", "error"] as const)),
    temporaryUrl: v.optional(v.string()),
    path: v.string(),
    url: v.pipe(v.string(), v.url("Url de video inválida")),
    width: v.pipe(v.number(), v.minValue(0, "El ancho debe ser no negativo")),
    height: v.pipe(v.number(), v.minValue(0, "La altura debe ser no negativa")),
    duration: v.pipe(
      v.number(),
      v.minValue(0, "La duración debe ser no negativa"),
    ),
    mimeType: v.picklist(["video/mp4", "video/webm", "video/ogg"]),
    thumbnail: v.optional(ImageSchema),
    // Fields set by the backend Cloud Function after processing
    thumbnailUrl: v.optional(v.string()),
    thumbnailPath: v.optional(v.string()),
    originalPath: v.optional(v.string()),
  }),
});

const MediaSchema = v.intersect([
  v.object({ id: v.string() }),
  v.variant("type", [ImageVariantsSchema, VideoSchema]),
]);

export type MediaItem = v.InferOutput<typeof MediaSchema>;

const CategoryInfoSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("El id es obligatorio")),
  title: v.pipe(v.string(), v.nonEmpty("El título es obligatorio")),
  slug: v.pipe(v.string(), v.nonEmpty("El slug es obligatorio")),
  tags: v.optional(v.array(v.string())),
});

const TiptapContentSchema = v.object({
  type: v.literal("doc"),
  content: v.optional(
    v.array(
      v.object({
        type: v.string(),
        content: v.optional(v.array(v.any())),
        attrs: v.optional(v.any()),
        text: v.optional(v.string()),
      }),
    ),
  ),
  attrs: v.optional(v.any()),
});
type TiptapContent = v.InferOutput<typeof TiptapContentSchema>;

interface TiptapNode {
  type: string;
  text?: string;
  content?: TiptapNode[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTiptapPlainText = (node: TiptapNode | TiptapContent | any): string => {
  if (node?.text) return node.text;
  if (node?.content && Array.isArray(node.content)) {
    return node.content.map(getTiptapPlainText).join("");
  }
  return "";
};

const RichTextWithLengthSchema = v.pipe(
  TiptapContentSchema,
  v.check((data) => {
    const textContent = getTiptapPlainText(data);
    return textContent.length > 0;
  }, "La descripción es requerida."),
  v.check((data) => {
    const textContent = getTiptapPlainText(data).trim();
    return textContent.length <= 1000;
  }, "La descripción no debe exceder los 1000 caracteres."),
);

export const step1Schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty("El título es obligatorio"),
    v.maxLength(60, "El título no debe exceder los 60 caracteres"),
    v.minLength(10, "El título no debe ser menor a 10 caracteres"),
  ),
  shortDescription: v.pipe(
    v.string(),
    v.nonEmpty("La descripción corta es requerida."),
    v.minLength(20, "La descripción corta debe tener al menos 20 caracteres."),
    v.maxLength(
      100,
      "La descripción corta no puede superar los 100 caracteres.",
    ),
  ),
  description: RichTextWithLengthSchema,
});

export const step2Schema = v.object({
  mainImage: v.optional(MainImageObjectSchema),
  media: v.optional(v.array(MediaSchema)),
});

export const step3Schema = v.object({
  categoryInfo: CategoryInfoSchema,
});

const locationObjectSchema = (errorMessage: string) =>
  v.pipe(
    v.object({
      isoCode: v.string(),
      name: v.string(),
    }),
    v.check((input) => input.isoCode.trim() !== "", errorMessage),
  );

export const step4Schema = v.object({
  location: v.object({
    country: locationObjectSchema("El país es requerido"),
    department: locationObjectSchema("El departamento es requerido"),
    city: v.pipe(v.string(), v.nonEmpty("La ciudad es requerida")),
    venue: v.pipe(v.string(), v.nonEmpty("El espacio es requerido")),
    address: v.pipe(v.string(), v.nonEmpty("La dirección es requerida")),
    moreInfo: v.optional(v.string()),
    coordinates: v.object({
      lat: v.number("La latitud es requerida"),
      lng: v.number("La longitud es requerida"),
    }),
  }),
});

const step5Object = v.object({
  startDate: v.string(),
  endDate: v.string(),
  status: v.picklist(["draft", "published", "cancelled", "ended"] as const),
});

export const step5Schema = v.pipe(
  step5Object,
  v.forward(
    v.check(
      (data) => new Date(data.endDate) >= new Date(data.startDate),
      "La fecha de fin no puede ser anterior a la fecha de inicio.",
    ),
    ["endDate"],
  ),
);

const step6Object = v.object({
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
    v.object({
      fields: v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          label: v.string(),
          placeholder: v.optional(v.string()),
          required: v.boolean(),
          options: v.optional(v.array(v.string())),
        }),
      ),
    }),
    { fields: [] },
  ),
});

export const step6Schema = v.pipe(
  step6Object,
  v.check(
    (data) =>
      data.registrationType !== "external" ||
      (!!data.externalUrl && data.externalUrl.trim().length > 0),
    "La URL externa es obligatoria cuando el tipo de registro es externo.",
  ),
  v.check(
    (data) =>
      data.registrationType !== "form" ||
      (!!data.registrationEventForm &&
        data.registrationEventForm.fields.length > 0),
    "Debes agregar al menos un campo si seleccionas formulario personalizado.",
  ),
);
const step7Object = v.object({
  price: v.object({
    isFree: v.boolean(),
    amount: v.pipe(
      v.unknown(),
      v.transform((val) => {
        if (typeof val === "number") return val;
        if (typeof val === "string" && val.trim() === "") return 0;
        const parsed = parseFloat(String(val));
        return isNaN(parsed) ? 0 : parsed;
      }),
      v.number("El precio debe ser un número válido"),
      v.minValue(0, "El monto no puede ser negativo"),
    ),
    currency: v.pipe(v.string(), v.nonEmpty("Debes seleccionar una divisa")),
  }),
});

export const step7Schema = v.pipe(
  step7Object,
  v.forward(
    v.check(
      (data) => data.price.isFree || data.price.amount > 0,
      "El monto debe ser mayor a 0 si el evento no es gratuito.",
    ),
    ["price", "amount"],
  ),
);

export const step8Schema = v.object({
  promotion: v.optional(
    v.object({
      isPromoted: v.optional(v.boolean()),
      promotedAt: v.nullish(v.string()),
      promotedUntil: v.nullish(v.string()),
    }),
  ),
});

const AuthorSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("El id es requerido")),
  displayName: v.pipe(v.string(), v.nonEmpty("El nombre es requerido")),
  photoURL: v.nullish(v.pipe(v.string(), v.url("Foto de perfil inválida"))),
});

const AuthorDraftSchema = v.object({
  ...AuthorSchema.entries,
  photoURL: v.optional(v.pipe(v.string(), v.url("Foto inválida"))),
});

export const EventSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("El id es requerido")),
  slug: v.optional(v.string()),
  ...step1Schema.entries,
  ...step2Schema.entries,
  author: AuthorSchema,
  ...step3Schema.entries,
  ...step4Schema.entries,
  ...step5Object.entries,
  ...step6Object.entries,
  ...step7Object.entries,
  ...step8Schema.entries,
  startDate: v.string(),
  endDate: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  publishedAt: v.optional(v.string()),
});

export const CreateEventSchema = v.omit(EventSchema, [
  "id",
  "createdAt",
  "updatedAt",
]);

export const publishEventSchema = v.object({
  id: v.optional(v.string()),
  slug: v.optional(v.string()),
  ...step1Schema.entries,
  ...step2Schema.entries,
  author: AuthorSchema,
  ...step3Schema.entries,
  ...step4Schema.entries,
  ...step5Object.entries,
  ...step6Object.entries,
  ...step7Object.entries,
  ...step8Schema.entries,
  startDate: v.string(),
  endDate: v.string(),
  createdAt: v.optional(v.string()),
  updatedAt: v.optional(v.string()),
  publishedAt: v.string(),
});

export const FormEventSchema = v.object({
  id: v.optional(v.string()),
  slug: v.optional(v.string()),
  title: v.optional(v.string()),
  shortDescription: v.optional(v.string()),
  description: v.optional(RichTextWithLengthSchema),

  // mainImage stored as object (url + path + optional status/temporaryUrl)
  mainImage: v.optional(MainImageObjectSchema),
  media: v.optional(v.array(MediaSchema)),

  categoryInfo: v.optional(
    v.object({
      id: v.optional(v.string()),
      title: v.optional(v.string()),
      slug: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
  ),
  location: v.optional(
    v.object({
      country: v.optional(v.object({ isoCode: v.string(), name: v.string() })),
      department: v.optional(
        v.object({ isoCode: v.string(), name: v.string() }),
      ),
      city: v.optional(v.string()),
      venue: v.optional(v.string()),
      address: v.optional(v.string()),
      moreInfo: v.optional(v.string()),
      coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    }),
  ),
  author: AuthorDraftSchema,
  promotion: v.optional(
    v.object({
      isPromoted: v.optional(v.boolean()),
      promotedAt: v.nullish(v.string()),
      promotedUntil: v.nullish(v.string()),
    }),
  ),

  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  status: v.optional(
    v.picklist(["draft", "published", "cancelled", "ended"] as const),
  ),
  registrationType: v.optional(
    v.picklist(["none", "internal", "external", "form"] as const),
  ),
  externalUrl: v.optional(v.string()),
  capacity: v.optional(v.number()),
  requiresAttendance: v.optional(v.boolean()),
  registrationEventForm: v.optional(
    v.object({
      fields: v.optional(v.array(v.any())),
    }),
  ),

  price: v.optional(
    v.object({
      isFree: v.optional(v.boolean()),
      amount: v.optional(v.number()),
      currency: v.optional(v.string()),
    }),
  ),
});
export type EventDto = v.InferOutput<typeof EventSchema>;
export type CreateEventDto = v.InferOutput<typeof CreateEventSchema>;
export type FormEventDto = v.InferOutput<typeof FormEventSchema>;
