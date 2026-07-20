"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SupportTicketDetailVM } from "@/presentation/studio/view-models/StudioSupportViewModel";

interface ActionResult {
  success: boolean;
  error?: string;
  detail?: SupportTicketDetailVM;
}

export async function getSupportTicketDetailAction(
  ticketId: string,
): Promise<ActionResult> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
      return { success: false, error: "No hay sesión activa." };
    }

    const { studioService } = createServerContainer();
    const d = await studioService.getSupportTicketDetail(
      ticketId,
      tokens.decodedToken.uid,
    );
    if (!d) {
      return { success: false, error: "No se encontró el ticket." };
    }

    return {
      success: true,
      detail: {
        id: d.id,
        subject: d.subject,
        category: d.category,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        description: d.description,
        attachments: d.attachments,
        closeReason: d.closeReason,
      },
    };
  } catch (error) {
    console.error("[GET SUPPORT TICKET DETAIL ERROR]", error);
    return { success: false, error: "No se pudo cargar el detalle." };
  }
}
