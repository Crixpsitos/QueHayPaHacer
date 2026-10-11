import * as v from "valibot";
import {
  REPORT_DETAILS_MAX,
  REPORT_OTHER_DETAILS_MIN,
  isReportReason,
} from "@/domain/entities/report/Report";

const DocId = v.pipe(v.string(), v.trim(), v.regex(/^[A-Za-z0-9_-]{1,128}$/, "Contenido inválido"));

export const ReportInputSchema = v.pipe(
  v.object({
    targetType: v.picklist(["event", "site"], "Contenido inválido"),
    targetId: DocId,
    sessionId: v.optional(DocId),
    reason: v.string("Selecciona un motivo"),
    details: v.optional(
      v.pipe(
        v.string(),
        v.trim(),
        v.maxLength(REPORT_DETAILS_MAX, `Máximo ${REPORT_DETAILS_MAX} caracteres`),
      ),
      "",
    ),
  }),
  v.check((i) => isReportReason(i.targetType, i.reason), "Selecciona un motivo válido"),
  v.check(
    (i) => i.reason !== "other" || i.details.length >= REPORT_OTHER_DETAILS_MIN,
    `Cuéntanos qué pasa (mínimo ${REPORT_OTHER_DETAILS_MIN} caracteres)`,
  ),
);

export type ReportInput = v.InferOutput<typeof ReportInputSchema>;

export function parseReportInput(
  input: unknown,
): { success: true; output: ReportInput } | { success: false; error: string } {
  const res = v.safeParse(ReportInputSchema, input);
  if (!res.success) return { success: false, error: res.issues[0].message };
  const output = res.output;
  // Las sesiones solo existen en eventos.
  if (output.targetType !== "event") delete output.sessionId;
  return { success: true, output };
}
