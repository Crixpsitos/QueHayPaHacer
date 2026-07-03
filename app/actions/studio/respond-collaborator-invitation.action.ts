"use server";

import { createServerContainer } from "@/infraestructure/di/container";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function respondCollaboratorInvitationAction(
  invitationId: string,
  accept: boolean,
): Promise<ActionResult> {
  try {
    const { studioService } = createServerContainer();
    await studioService.respondCollaboratorInvitation(invitationId, accept);
    return { success: true };
  } catch (error) {
    console.error("[RESPOND COLLABORATOR INVITATION ERROR]", error);
    return { success: false, error: "No se pudo procesar la invitación." };
  }
}
