"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function respondCollaboratorInvitationAction(
  invitationId: string,
  accept: boolean,
): Promise<ActionResult> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };

    const { studioService } = createServerContainer();
    // El uid de sesión debe ser el invitado; el repo lo verifica.
    await studioService.respondCollaboratorInvitation(
      invitationId,
      tokens.decodedToken.uid,
      accept,
    );
    revalidatePath("/studio/collaborators");
    return { success: true };
  } catch (error) {
    console.error("[RESPOND COLLABORATOR INVITATION ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudo procesar la invitación.";
    return { success: false, error: message };
  }
}
