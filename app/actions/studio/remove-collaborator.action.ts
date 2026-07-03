"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function removeCollaboratorAction(collaboratorUid: string): Promise<ActionResult> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
      return { success: false, error: "No hay sesión activa." };
    }
    const { studioService } = createServerContainer();
    await studioService.removeCollaborator(tokens.decodedToken.uid, collaboratorUid);
    return { success: true };
  } catch (error) {
    console.error("[REMOVE COLLABORATOR ERROR]", error);
    return { success: false, error: "No se pudo quitar al colaborador." };
  }
}
