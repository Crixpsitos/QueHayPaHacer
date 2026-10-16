"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath, updateTag } from "next/cache";

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

    const { studioService, notificationService } = createServerContainer();
    // El uid de sesión debe ser el invitado; el repo lo verifica.
    const answered = await studioService.respondCollaboratorInvitation(
      invitationId,
      tokens.decodedToken.uid,
      accept,
    );
    if (answered) {
      const who = answered.responderName || "Alguien";
      await notificationService.notify(
        answered.fromUid,
        answered.accepted
          ? {
              type: "invitation_accepted",
              title: `${who} aceptó tu invitación`,
              body: "Ya puedes sumarle al equipo de tus eventos.",
              href: "/studio/collaborators",
            }
          : {
              type: "invitation_declined",
              title: `${who} rechazó tu invitación`,
              href: "/studio/collaborators",
            },
        `invite-${answered.accepted ? "accepted" : "declined"}-${invitationId}`,
      );
    }
    revalidatePath("/studio/collaborators");
    updateTag(`invitations-${tokens.decodedToken.uid}`);
    return { success: true };
  } catch (error) {
    console.error("[RESPOND COLLABORATOR INVITATION ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudo procesar la invitación.";
    return { success: false, error: message };
  }
}
