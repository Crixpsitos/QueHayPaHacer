"use server";

import { updateTag } from "next/cache";
import { requireEventPermission, teamAccessTag } from "@/app/actions/_session";
import { isRoleValidForKind } from "@/domain/entities/events/teamPolicy";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Cambia el rol de un miembro del equipo del evento. Solo el dueño (manage_team).
 * Externos solo `credit`; `owner` nunca es asignable.
 */
export async function changeCollaboratorRoleAction(input: {
  eventId: string;
  refId: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { eventId, refId, role } = input ?? ({} as typeof input);
    if (!eventId || !refId || typeof role !== "string") return { success: false, error: "Datos inválidos." };
    const access = await requireEventPermission(eventId, "manage_team");
    if (!access) return { success: false, error: "No autorizado." };

    const { eventsService, studioService } = createServerContainer();
    const event = await eventsService.getEventById(eventId);
    const member = event?.collaborators?.find((c) => c.refId === refId);
    if (!member) return { success: false, error: "Esa persona no está en el equipo del evento." };
    if (!isRoleValidForKind(member.kind, role)) {
      return {
        success: false,
        error: member.kind === "external" ? "Los perfiles externos solo pueden ser crédito." : "Rol inválido.",
      };
    }

    await studioService.changeCollaboratorRole(eventId, refId, role, access.uid);
    updateTag(`event-${eventId}`);
    updateTag(teamAccessTag(refId));
    return { success: true };
  } catch (error) {
    console.error("[CHANGE COLLABORATOR ROLE ERROR]", error);
    return { success: false, error: error instanceof Error ? error.message : "No se pudo cambiar el rol." };
  }
}
