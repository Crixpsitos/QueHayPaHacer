export type ReportTargetType = "event" | "site";
export type ReportStatus = "open" | "resolved";

/** Motivos por tipo de contenido (valor → etiqueta). Compartido por la UI y la validación del servidor. */
export const REPORT_REASONS = {
  event: [
    { value: "false_info", label: "Información falsa o engañosa" },
    { value: "cancelled", label: "El evento fue cancelado o cambió de fecha" },
    { value: "wrong_details", label: "Fecha, hora o lugar incorrectos" },
    { value: "inappropriate", label: "Contenido inapropiado u ofensivo" },
    { value: "scam", label: "Posible estafa o cobro fraudulento" },
    { value: "spam", label: "Spam o publicidad no relacionada" },
    { value: "copyright", label: "Usa imágenes o contenido sin permiso" },
    { value: "other", label: "Otro motivo" },
  ],
  site: [
    { value: "closed", label: "El lugar cerró permanentemente" },
    { value: "wrong_location", label: "Dirección o ubicación incorrecta" },
    { value: "wrong_hours", label: "Horario incorrecto" },
    { value: "false_info", label: "Información falsa o engañosa" },
    { value: "inappropriate", label: "Contenido inapropiado u ofensivo" },
    { value: "spam", label: "Spam o publicidad no relacionada" },
    { value: "copyright", label: "Usa imágenes o contenido sin permiso" },
    { value: "other", label: "Otro motivo" },
  ],
} as const satisfies Record<ReportTargetType, readonly { value: string; label: string }[]>;

export const REPORT_DETAILS_MAX = 500;
export const REPORT_OTHER_DETAILS_MIN = 10;

export function isReportReason(targetType: ReportTargetType, reason: string): boolean {
  return REPORT_REASONS[targetType].some((r) => r.value === reason);
}

export interface Report {
  targetType: ReportTargetType;
  targetId: string;
  sessionId?: string;
  reason: string;
  details: string;
  uid: string;
  status: ReportStatus;
  targetTitle: string;
  targetAuthorId: string | null;
}

/** Un reporte por usuario y contenido. */
export const reportId = (r: Pick<Report, "targetType" | "targetId" | "uid">) =>
  `${r.targetType}_${r.targetId}_${r.uid}`;
