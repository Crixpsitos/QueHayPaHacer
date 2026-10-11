"use server";

import { getSessionUid } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import type { ReportResult } from "@/application/services/report/ReportService";

export interface ReportContentInput {
  targetType: "event" | "site";
  targetId: string;
  sessionId?: string;
  reason: string;
  details?: string;
}

export async function reportContentAction(input: ReportContentInput): Promise<ReportResult> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: "Inicia sesión para reportar." };

  try {
    // Solo se toman los campos esperados; el resto lo valida el servicio.
    const { targetType, targetId, sessionId, reason, details } = input;
    return await createServerContainer().reportService.submit(uid, {
      targetType,
      targetId,
      sessionId,
      reason,
      details,
    });
  } catch (e) {
    console.error("[reportContent]", e);
    return { success: false, error: "No se pudo enviar el reporte. Intenta nuevamente." };
  }
}
