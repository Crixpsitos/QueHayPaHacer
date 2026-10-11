/**
 * Permisos del equipo de un evento. Un solo lugar define quién puede qué; los guards de servidor
 * y la interfaz leen esta matriz (la UI solo oculta, el servidor es quien autoriza).
 *
 * Roles (además del dueño = `event.author.id`):
 * - editor    coorganizador: edita y publica, ve inscritos con contacto, escanea y confirma asistencia.
 * - viewer    lector: estadísticas e inscritos (sin contacto), solo lectura.
 * - checkin   control de acceso: solo escanear/confirmar asistencia, ve nombres.
 * - credit    solo aparece acreditado en el evento (también los perfiles externos).
 */
export type TeamRole = "editor" | "viewer" | "checkin" | "credit";
export type EventAccessRole = "owner" | TeamRole;

export type TeamAction =
  | "view_event_studio" // abrir el Studio del evento
  | "view_stats"
  | "view_registrations" // lista con nombre y estado de asistencia
  | "view_attendee_contact" // correo, teléfono y respuestas del formulario
  | "export_registrations"
  | "scan_attendance"
  | "confirm_attendance"
  | "remove_participant"
  | "edit_event"
  | "publish_event" // publicar/republicar: quien publica firma la declaración del autor
  | "delete_event"
  | "manage_team";

const ALL: TeamAction[] = [
  "view_event_studio", "view_stats", "view_registrations", "view_attendee_contact", "export_registrations",
  "scan_attendance", "confirm_attendance", "remove_participant", "edit_event", "publish_event",
  "delete_event", "manage_team",
];

const MATRIX: Record<EventAccessRole, readonly TeamAction[]> = {
  owner: ALL,
  editor: [
    "view_event_studio", "view_stats", "view_registrations", "view_attendee_contact", "export_registrations",
    "scan_attendance", "confirm_attendance", "remove_participant", "edit_event", "publish_event",
  ],
  viewer: ["view_event_studio", "view_stats", "view_registrations"],
  checkin: ["view_event_studio", "view_registrations", "scan_attendance", "confirm_attendance"],
  credit: [],
};

export function can(role: EventAccessRole | null | undefined, action: TeamAction): boolean {
  return !!role && MATRIX[role].includes(action);
}

/** Roles que se pueden asignar a una persona con cuenta (los externos solo `credit`). */
export const ASSIGNABLE_USER_ROLES: readonly TeamRole[] = ["editor", "viewer", "checkin", "credit"];

export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  editor: "Editor",
  viewer: "Lector",
  checkin: "Control de acceso",
  credit: "Solo crédito",
};

export const TEAM_ROLE_DESCRIPTION: Record<TeamRole, string> = {
  editor: "Edita y publica el evento, ve a los inscritos con sus datos de contacto y confirma asistencia.",
  viewer: "Ve estadísticas e inscritos (nombre y estado). No ve datos de contacto ni cambia nada.",
  checkin: "Escanea el QR y confirma asistencia en la puerta. Solo ve nombres.",
  credit: "Aparece acreditado en el evento. No tiene acceso al Studio.",
};

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && (ASSIGNABLE_USER_ROLES as readonly string[]).includes(value);
}

/** ¿Este rol concede acceso al Studio del evento? (credit no). */
export const hasStudioAccess = (role: EventAccessRole | null | undefined) => can(role, "view_event_studio");

/**
 * Rol de `uid` en un evento a partir de los datos del evento. Sin permisos si no es dueño ni miembro
 * con cuenta (`kind: "user"`); los externos nunca tienen acceso.
 */
export function resolveEventRole(
  event: {
    author: { id: string };
    collaborators?: { refId: string; kind: string }[];
    collaboratorsData?: Record<string, { role?: string }>;
  },
  uid: string | null | undefined,
): EventAccessRole | null {
  if (!uid) return null;
  if (event.author.id === uid) return "owner";
  const member = event.collaborators?.find((c) => c.refId === uid && c.kind === "user");
  const role = member ? event.collaboratorsData?.[uid]?.role : undefined;
  return isTeamRole(role) ? role : null;
}
