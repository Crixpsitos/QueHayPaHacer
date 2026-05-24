import * as v from "valibot";

const ImageSchema = v.object({
  url: v.pipe(v.string(), v.url("Invalid image URL")),
  width: v.pipe(v.number(), v.minValue(0, "width must be non-negative")),
  height: v.pipe(v.number(), v.minValue(0, "height must be non-negative")),
  alt: v.string(),
});

const ImageVariantsSchema = v.object({
  type: v.literal("image"),
  desktop: ImageSchema,
  mobile: ImageSchema,
  tablet: ImageSchema,
});

const VideoSchema = v.object({
  type: v.literal("video"),
  url: v.pipe(v.string(), v.url("Invalid video URL")),
  width: v.pipe(v.number(), v.minValue(0)),
  height: v.pipe(v.number(), v.minValue(0)),
  duration: v.pipe(v.number(), v.minValue(0)),
  mimeType: v.picklist(["video/mp4", "video/webm", "video/ogg"]),
  thumbnail: v.optional(ImageSchema),
});

const MediaSchema = v.variant("type", [ImageVariantsSchema, VideoSchema]);

const CategoryInfoSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("id is required")),
  title: v.pipe(v.string(), v.nonEmpty("title is required")),
  slug: v.pipe(v.string(), v.nonEmpty("slug is required")),
  tags: v.optional(v.array(v.string())),
});

const TiptapContentSchema = v.object({
  type: v.literal("doc"),
  content: v.optional(
    v.array(
      v.object({
        type: v.string(),
        content: v.optional(v.array(v.any())),
        attrs: v.optional(v.record(v.string(), v.any())),
        text: v.optional(v.string()),
      }),
    ),
  ),
  attrs: v.optional(v.record(v.string(), v.any())),
});

type TiptapContent = v.InferOutput<typeof TiptapContentSchema>;

const RichTextWithLengthSchema = v.pipe(
  TiptapContentSchema,
  v.check((data) => {
    const content = (data as TiptapContent).content;
    const textContent = (content || [])
      .map((node) => node.text || "")
      .join(" ");
    return textContent.length <= 1000;
  }, "La descripción no debe exceder los 1000 caracteres."),
);

export const step1Schema = v.object({
  title: v.pipe(v.string(), v.nonEmpty("El título es obligatorio"), v.maxLength(60, "El título no debe exceder los 60 caracteres"), v.minLength(10, "El título no debe ser menor a 10 caracteres")),
  shortDescription: v.pipe(
  v.string(),
  v.nonEmpty("La descripción corta es requerida."),
  v.maxLength(100, "La descripción corta no puede superar los 100 caracteres.")
),
  description: v.optional(RichTextWithLengthSchema),
});

export const step2Schema = v.object({
  mainImage: v.custom<File | null>(
    (input): input is File | null => input === null || input instanceof File,
    "Tu imagen principal debe ser un archivo de imagen o un video",
  ),
  media: v.optional(
    v.array(
      v.custom<File | null>(
        (input): input is File | null =>
          input === null || input instanceof File,
        "Tus medios deben ser archivos de imagen o video",
      ),
    ),
  ),
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
    v.check((input) => input.isoCode.trim() !== "", errorMessage)
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
export const step5Schema = v.pipe(
  v.object({
    startDate: v.string(),
    endDate: v.string(),
    status: v.picklist(["draft", "published", "cancelled", "ended"]),
  }),
  v.forward(
    v.check(
      (data) => new Date(data.endDate) >= new Date(data.startDate),
      "La fecha de fin no puede ser anterior a la fecha de inicio."
    ),
    ["endDate"]
  )
);

export const step6Schema = v.pipe(
  v.object({
    registrationType: v.picklist(["none", "internal", "external", "form"]),
    externalUrl: v.optional(v.string()),
    capacity: v.optional(v.number()),
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
          })
        ),
      }),
      { fields: [] }
    ),
  }),
  v.check(
    (data) =>
      data.registrationType !== "external" ||
      (!!data.externalUrl && data.externalUrl.trim().length > 0),
    "La URL externa es obligatoria cuando el tipo de registro es externo."
  ),
  v.check(
    (data) =>
      data.registrationType !== "form" ||
      (!!data.registrationEventForm && data.registrationEventForm.fields.length > 0),
    "Debes agregar al menos un campo si seleccionas formulario personalizado."
  )
);

export const step7Schema = v.pipe(
  v.object({
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
        v.minValue(0, "El monto no puede ser negativo")
      ),
      currency: v.pipe(v.string(), v.nonEmpty("Debes seleccionar una divisa")),
    }),
  }),
  v.forward(
    v.check(
      (data) => data.price.isFree || data.price.amount > 0,
      "El monto debe ser mayor a 0 si el evento no es gratuito."
    ),
    ["price", "amount"]
  )
);

export const step8Schema = v.object({
  promotion: v.object({
    isPromoted: v.boolean(),
    promotedAt: v.string(),
    promotedUntil: v.string(),
  }),
});

export const EventSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("id is required")),
  ...step1Schema.entries,

  ...step2Schema.entries,
  author: v.object({
    id: v.pipe(v.string(), v.nonEmpty("id is required")),
    displayName: v.pipe(v.string(), v.nonEmpty("displayName is required")),
    photoURL: v.pipe(v.string(), v.url("Invalid photoURL")),
  }),
  ...step3Schema.entries,
  ...step4Schema.entries,
  ...step5Schema.entries,
  ...step6Schema.entries,
  ...step7Schema.entries,
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

export type EventDto = v.InferOutput<typeof EventSchema>;
export type CreateEventDto = v.InferOutput<typeof CreateEventSchema>;
