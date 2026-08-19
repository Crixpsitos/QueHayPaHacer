"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath } from "next/cache";
import type { CollaboratorKind } from "@/domain/entities/studio/Studio";

/** Quita de mi red a un colaborador (user aceptado o externo mío). */
export async function removeCollaboratorAction(
  refId: string,
  kind: CollaboratorKind,
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "No hay sesión activa." };
    if (!refId || (kind !== "user" && kind !== "external")) {
      return { success: false, error: "Datos inválidos." };
    }

    const { studioService } = createServerContainer();
    await studioService.removeCollaborator(tokens.decodedToken.uid, refId, kind);
    revalidatePath("/studio/collaborators");
    return { success: true };
  } catch (error) {
    console.error("[REMOVE COLLABORATOR ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudo quitar el colaborador.";
    return { success: false, error: message };
  }
}
