"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function inviteCollaboratorAction(email: string): Promise<ActionResult> {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Correo inválido." };
  }

  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
      return { success: false, error: "No hay sesión activa." };
    }

    const { studioService } = createServerContainer();
    await studioService.inviteCollaborator(tokens.decodedToken.uid, trimmed);
    return { success: true };
  } catch (error) {
    console.error("[INVITE COLLABORATOR ERROR]", error);
    return { success: false, error: "No se pudo enviar la invitación." };
  }
}
