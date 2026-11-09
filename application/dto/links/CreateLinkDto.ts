import * as v from "valibot"
import { LINK_TARGET_TYPES } from "@/domain/entities/links/link"

/** Lo que el formulario manda. El dueño NUNCA viaja aquí: sale de la sesión. */
export const CreateLinkSchema = v.object({
  label: v.pipe(v.string(), v.trim(), v.minLength(1, "Ponle una etiqueta al enlace."), v.maxLength(60, "La etiqueta admite hasta 60 caracteres.")),
  targetType: v.picklist(LINK_TARGET_TYPES, "Elige un evento o un sitio."),
  targetId: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/, "Elige un evento o un sitio.")),
})
