"use server";

import { requireEventPermission } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import { summarizeIncome, type IncomeSummary } from "@/domain/entities/EventRegistration/payment";

export type EventIncomeResult = { success: true; income: IncomeSummary } | { success: false; error: string };

/** Ingresos de un evento externo: total cobrado y por categoría entre las personas confirmadas. Cualquier cuenta que organiza (sin Premium). */
export async function getEventIncomeAction(eventId: string): Promise<EventIncomeResult> {
  const id = eventId?.trim();
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return { success: false, error: "Evento inválido." };
  const access = await requireEventPermission(id, "confirm_attendance", { ownerNeedsPremium: false });
  if (!access) return { success: false, error: "No tienes permiso en este evento." };
  try {
    return { success: true, income: summarizeIncome(await createServerContainer().studioService.getPaymentRows(id)) };
  } catch (e) {
    console.error("[event-income]", e instanceof Error ? e.message : "error");
    return { success: false, error: "No se pudieron cargar los ingresos." };
  }
}
