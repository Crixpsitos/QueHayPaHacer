"use server";

import { getPremiumSessionUid } from "@/app/actions/_session";

import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath } from "next/cache";

/** Cancela una invitación pendiente que YO envié. */
export async function cancelInvitationAction(
  inviteId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const uid = await getPremiumSessionUid();
    if (!uid) return { success: false, error: "No hay sesión activa." };

    const { studioService } = createServerContainer();
    await studioService.cancelInvitation(inviteId, uid);
    revalidatePath("/studio/collaborators");
    return { success: true };
  } catch (error) {
    console.error("[CANCEL INVITATION ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudo cancelar la invitación.";
    return { success: false, error: message };
  }
}
