import * as v from "valibot";
import { CLAIM_EVIDENCE_MAX, CLAIM_EVIDENCE_MIN, CLAIM_RELATIONS } from "@/domain/entities/siteClaim/SiteClaim";

const PHONE_RE = /^\+?\d{7,15}$/;

export const SiteClaimInputSchema = v.object({
  siteId: v.pipe(v.string(), v.trim(), v.regex(/^[A-Za-z0-9_-]{1,128}$/, "Lugar inválido")),
  relation: v.picklist(CLAIM_RELATIONS, "Elige tu relación con el lugar"),
  contactPhone: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.transform((s) => s.replace(/[\s().-]/g, "")),
      v.check((s) => s === "" || PHONE_RE.test(s), "Teléfono inválido"),
    ),
    "",
  ),
  evidence: v.pipe(
    v.string("Cuéntanos cómo comprobarlo"),
    v.trim(),
    v.minLength(CLAIM_EVIDENCE_MIN, `Cuéntanos cómo comprobarlo (mínimo ${CLAIM_EVIDENCE_MIN} caracteres)`),
    v.maxLength(CLAIM_EVIDENCE_MAX, `Máximo ${CLAIM_EVIDENCE_MAX} caracteres`),
  ),
  declaration: v.literal(true, "Debes aceptar la declaración"),
});

export type SiteClaimInput = v.InferOutput<typeof SiteClaimInputSchema>;

export function parseSiteClaimInput(
  input: unknown,
): { success: true; output: SiteClaimInput } | { success: false; error: string } {
  const res = v.safeParse(SiteClaimInputSchema, input);
  return res.success ? { success: true, output: res.output } : { success: false, error: res.issues[0].message };
}
