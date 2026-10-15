import * as v from "valibot";
import {
  SUGGESTION_DESCRIPTION_MAX,
  SUGGESTION_DESCRIPTION_MIN,
  SUGGESTION_FIELDS,
  SUGGESTION_SOURCE_MAX,
} from "@/domain/entities/siteSuggestion/SiteSuggestion";

export const SiteSuggestionInputSchema = v.object({
  siteId: v.pipe(v.string(), v.trim(), v.regex(/^[A-Za-z0-9_-]{1,128}$/, "Lugar inválido")),
  field: v.picklist(SUGGESTION_FIELDS, "Elige qué quieres cambiar"),
  description: v.pipe(
    v.string("Cuéntanos qué cambiar"),
    v.trim(),
    v.minLength(SUGGESTION_DESCRIPTION_MIN, `Cuéntanos qué cambiar (mínimo ${SUGGESTION_DESCRIPTION_MIN} caracteres)`),
    v.maxLength(SUGGESTION_DESCRIPTION_MAX, `Máximo ${SUGGESTION_DESCRIPTION_MAX} caracteres`),
  ),
  source: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(SUGGESTION_SOURCE_MAX, `Máximo ${SUGGESTION_SOURCE_MAX} caracteres`)),
    "",
  ),
  declaration: v.literal(true, "Debes aceptar la declaración"),
});

export type SiteSuggestionInput = v.InferOutput<typeof SiteSuggestionInputSchema>;

export function parseSiteSuggestionInput(
  input: unknown,
): { success: true; output: SiteSuggestionInput } | { success: false; error: string } {
  const res = v.safeParse(SiteSuggestionInputSchema, input);
  return res.success ? { success: true, output: res.output } : { success: false, error: res.issues[0].message };
}
