import { can, isTeamRole, type EventAccessRole, type TeamAction, type TeamRole } from "./teamAccess";

/**
 * Lógica pura de equipo (sin I/O) usada por los guards de servidor: máscara de privacidad
 * de inscritos por rol y reconciliación del equipo cuando se guarda el evento.
 */

/** Quita datos de contacto (respuestas del formulario) si el rol no puede verlos. Aplicar SIEMPRE en servidor. */
export function maskRegistrationsForRole<T extends { formResponses?: unknown }>(
  registrations: T[],
  role: EventAccessRole | null | undefined,
): T[] {
  if (can(role, "view_attendee_contact")) return registrations;
  return registrations.map((r) => {
    const { formResponses: _omit, ...rest } = r;
    void _omit;
    return rest as T;
  });
}

type CollabRef = { refId: string; kind: "user" | "external" };
type CollabData = Record<string, { displayName: string; photoURL?: string | null; role: TeamRole }>;
export interface TeamState {
  collaborators: CollabRef[];
  collaboratorsData: CollabData;
}

/**
 * Equipo resultante de un guardado del evento. El cliente manda todo el equipo, así que:
 * - quien no es dueño no cambia nada (se conserva el guardado);
 * - el dueño solo agrega miembros de SU red (usuarios aceptados con rol de cuenta; externos suyos
 *   solo como `credit`), no a sí mismo; los miembros existentes conservan su rol (cambia con
 *   `changeCollaboratorRoleAction`); quitar = omitirlos.
 * `changedUids` son los usuarios cuyo acceso cambió (para invalidar `team-access-<uid>`).
 */
export function reconcileTeam(args: {
  existing: Partial<TeamState> | undefined;
  incoming: Partial<TeamState> | undefined;
  actorRole: EventAccessRole | null;
  ownerId: string;
  networkUserIds: ReadonlySet<string>;
  networkExternalIds: ReadonlySet<string>;
}): TeamState & { changedUids: string[] } {
  const existing: TeamState = {
    collaborators: args.existing?.collaborators ?? [],
    collaboratorsData: args.existing?.collaboratorsData ?? {},
  };
  if (args.actorRole !== "owner") return { ...existing, changedUids: [] };

  const collaborators: CollabRef[] = [];
  const collaboratorsData: CollabData = {};
  const seen = new Set<string>();
  for (const c of args.incoming?.collaborators ?? []) {
    if (!c?.refId || seen.has(c.refId) || c.refId === args.ownerId) continue;
    const prev = existing.collaborators.find((e) => e.refId === c.refId);
    if (prev) {
      seen.add(c.refId);
      collaborators.push(prev);
      if (existing.collaboratorsData[c.refId]) collaboratorsData[c.refId] = existing.collaboratorsData[c.refId];
      continue;
    }
    const data = args.incoming?.collaboratorsData?.[c.refId];
    if (!data) continue;
    const valid =
      c.kind === "user"
        ? args.networkUserIds.has(c.refId) && isTeamRole(data.role)
        : c.kind === "external" && args.networkExternalIds.has(c.refId) && data.role === "credit";
    if (!valid) continue;
    seen.add(c.refId);
    collaborators.push({ refId: c.refId, kind: c.kind });
    collaboratorsData[c.refId] = data;
  }

  const userIds = (t: TeamState) => t.collaborators.filter((c) => c.kind === "user").map((c) => c.refId);
  const next = { collaborators, collaboratorsData };
  const changedUids = [...new Set([...userIds(existing), ...userIds(next)])].filter(
    (uid) => !(userIds(existing).includes(uid) && userIds(next).includes(uid)),
  );
  return { ...next, changedUids };
}

/** Rol válido para un miembro según su tipo (los externos solo `credit`; nadie recibe `owner`). */
export function isRoleValidForKind(kind: "user" | "external", role: unknown): role is TeamRole {
  return kind === "external" ? role === "credit" : isTeamRole(role);
}

const ACTIONS: TeamAction[] = [
  "view_event_studio", "view_stats", "view_registrations", "view_attendee_contact", "export_registrations",
  "scan_attendance", "confirm_attendance", "remove_participant", "edit_event", "publish_event",
  "delete_event", "manage_team",
];

/** Permisos del rol como objeto serializable (server → client) para que la UI oculte controles. */
export function permissionsFor(role: EventAccessRole | null | undefined): Record<TeamAction, boolean> {
  return Object.fromEntries(ACTIONS.map((a) => [a, can(role, a)])) as Record<TeamAction, boolean>;
}
