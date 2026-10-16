"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath, updateTag } from "next/cache";
import type { InviteeInput } from "@/domain/entities/studio/Studio";

/** Envía invitaciones a varios usuarios a la vez. Solo plan Premium. */
export async function inviteCollaboratorsAction(
  invitees: InviteeInput[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };
    if (!Array.isArray(invitees) || invitees.length === 0) {
      return { success: false, error: "Selecciona al menos un usuario." };
    }

    const { userService, studioService, notificationService } = createServerContainer();
    const me = await userService.getUserById(tokens.decodedToken.uid);
    if (me?.plan !== "premium") {
      return { success: false, error: "Necesitas el plan Premium para invitar." };
    }

    // Solo las invitaciones realmente creadas (el repositorio omite duplicados y no creadores).
    const { inviterName, invited } = await studioService.inviteCollaborators(tokens.decodedToken.uid, invitees);
    revalidatePath("/studio/collaborators");
    await Promise.all(
      invited.map((toUid) =>
        notificationService.notify(toUid, {
          type: "invitation_received",
          title: `${inviterName || "Alguien"} te invitó a su red de colaboradores`,
          body: "Acepta para que pueda sumarte al equipo de sus eventos.",
          href: "/mis-invitaciones",
        }),
      ),
    );
    // El contador de "Mis invitaciones" de cada invitado se actualiza al instante.
    for (const toUid of invited) updateTag(`invitations-${toUid}`);
    return { success: true };
  } catch (error) {
    console.error("[INVITE COLLABORATORS ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudieron enviar las invitaciones.";
    return { success: false, error: message };
  }
}
