"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
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
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
      return { success: false, error: "No hay sesión activa." };
    }

    const { studioService } = createServerContainer();
    const id = await studioService.createSupportTicket(tokens.decodedToken.uid, {
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
