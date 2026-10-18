"use server";

import { getPremiumSessionUid } from "@/app/actions/_session";

import { createServerContainer } from "@/infraestructure/di/container";

interface CreateSupportTicketPayload {
  subject: string;
  category: string;
  description: string;
  attachments?: string[];
}

interface ActionResult {
  success: boolean;
  error?: string;
  /** Ticket creado (para pintarlo en el historial sin recargar). */
  ticket?: { id: string; createdAt: string };
}

export async function createSupportTicketAction(
  payload: CreateSupportTicketPayload,
): Promise<ActionResult> {
  const subject = payload.subject.trim();
  const description = payload.description.trim();

  if (!subject || !description || !payload.category) {
    return { success: false, error: "Completa asunto, categoría y descripción." };
  }

  try {
    const uid = await getPremiumSessionUid();
    if (!uid) {
      return { success: false, error: "No hay sesión activa." };
    }

    const { studioService } = createServerContainer();
    const id = await studioService.createSupportTicket(uid, {
      subject,
      category: payload.category,
      description,
      attachments: payload.attachments,
    });
    return { success: true, ticket: { id, createdAt: new Date().toISOString() } };
  } catch (error) {
    console.error("[CREATE SUPPORT TICKET ERROR]", error);
    return { success: false, error: "No se pudo enviar el ticket." };
  }
}
