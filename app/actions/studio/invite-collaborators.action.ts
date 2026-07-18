"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath } from "next/cache";
import type { InviteeInput } from "@/domain/entities/studio/Studio";

/** Envía invitaciones a varios usuarios a la vez. Solo cuentas profesionales. */
export async function inviteCollaboratorsAction(
  invitees: InviteeInput[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };
    if (!Array.isArray(invitees) || invitees.length === 0) {
      return { success: false, error: "Selecciona al menos un usuario." };
    }

    const { userService, studioService } = createServerContainer();
    const me = await userService.getUserById(tokens.decodedToken.uid);
    if (me?.accountType !== "professional") {
      return { success: false, error: "Solo cuentas profesionales pueden invitar." };
    }

    await studioService.inviteCollaborators(tokens.decodedToken.uid, invitees);
    revalidatePath("/studio/collaborators");
    return { success: true };
  } catch (error) {
    console.error("[INVITE COLLABORATORS ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudieron enviar las invitaciones.";
    return { success: false, error: message };
  }
}
