import { updateTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { reconcileTeam } from "@/domain/entities/events/teamPolicy";
import type { EventAccessRole } from "@/domain/entities/events/teamAccess";
import type { Events } from "@/domain/entities/events/Events";

/**
 * El equipo del evento llega del cliente con el resto del formulario: aquí se normaliza.
 * Quien no es dueño no lo cambia; el dueño solo suma gente de su red (ver `reconcileTeam`).
 * Devuelve el evento con el equipo final y los uids cuyo acceso cambió.
 */
export async function applyTeamPolicy<T extends Events>(
  event: T,
  existing: Events | null,
  actorRole: EventAccessRole | null,
  ownerId: string,
): Promise<{ event: T; changedUids: string[] }> {
  const known = new Set((existing?.collaborators ?? []).map((c) => c.refId));
  const needsNetwork =
    actorRole === "owner" && (event.collaborators ?? []).some((c) => !known.has(c.refId) && c.refId !== ownerId);
  const network = needsNetwork ? await createServerContainer().studioService.getCollaborators(ownerId) : [];
  const team = reconcileTeam({
    existing: existing ?? undefined,
    incoming: event,
    actorRole,
    ownerId,
    networkUserIds: new Set(network.filter((c) => c.kind === "user").map((c) => c.refId)),
    networkExternalIds: new Set(network.filter((c) => c.kind === "external").map((c) => c.refId)),
  });
  const { changedUids, ...rest } = team;
  return { event: { ...event, ...rest }, changedUids };
}

export function invalidateTeamAccess(uids: string[]): void {
  for (const uid of uids) updateTag(`team-access-${uid}`);
}
