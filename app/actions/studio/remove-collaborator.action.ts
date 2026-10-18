"use server";

import { getPremiumSessionUid } from "@/app/actions/_session";

import { createServerContainer } from "@/infraestructure/di/container";
import { revalidatePath, updateTag } from "next/cache";
import { teamAccessTag } from "@/app/actions/_session";
import type { CollaboratorKind } from "@/domain/entities/studio/Studio";

/** Quita de mi red a un colaborador (user aceptado o externo mío). */
export async function removeCollaboratorAction(
  refId: string,
  kind: CollaboratorKind,
): Promise<{ success: boolean; error?: string }> {
  try {
    const uid = await getPremiumSessionUid();
    if (!uid) return { success: false, error: "No hay sesión activa." };
    if (!refId || (kind !== "user" && kind !== "external")) {
      return { success: false, error: "Datos inválidos." };
    }

    const { studioService } = createServerContainer();
    await studioService.removeCollaborator(uid, refId, kind);
    if (kind === "user") {
      // El vínculo se rompe en ambos sentidos: nadie conserva acceso por equipo a eventos del otro.
      const [mine, theirs] = await Promise.all([
        studioService.removeMemberFromOwnerEvents(uid, refId),
        studioService.removeMemberFromOwnerEvents(refId, uid),
      ]);
      for (const id of [...mine, ...theirs]) updateTag(`event-${id}`);
      updateTag(teamAccessTag(refId));
      updateTag(teamAccessTag(uid));
    }
    revalidatePath("/studio/collaborators");
    return { success: true };
  } catch (error) {
    console.error("[REMOVE COLLABORATOR ERROR]", error);
    const message = error instanceof Error ? error.message : "No se pudo quitar el colaborador.";
    return { success: false, error: message };
  }
}
