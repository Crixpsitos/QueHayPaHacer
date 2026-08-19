"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function closeSupportTicketAction(
  ticketId: string,
  reason: string,
): Promise<ActionResult> {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { success: false, error: "Indica el motivo del cierre." };
  }

  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
      return { success: false, error: "No hay sesión activa." };
    }

    const { studioService } = createServerContainer();
    await studioService.closeSupportTicket(ticketId, tokens.decodedToken.uid, trimmed);
    return { success: true };
  } catch (error) {
    console.error("[CLOSE SUPPORT TICKET ERROR]", error);
    return { success: false, error: "No se pudo cerrar el ticket." };
  }
}
