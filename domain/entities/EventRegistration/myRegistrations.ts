/** Lógica pura del panel "Mis inscripciones" (sin dependencias de infraestructura). */

export type RegistrationStatus = "registered" | "waitlist" | "accepted" | "canceled";

/** Inscripción del usuario ya unida con los datos del evento/sesión. Fechas en ISO 8601. */
export interface UserRegistrationItem {
  eventId: string;
  sessionId?: string;
  /** Título a mostrar (el de la sesión si la tiene, si no el del evento). */
  title: string;
  /** Solo sesiones: título del evento padre. */
  eventTitle?: string;
  /** Slug del evento (o su id) para el enlace. */
  eventRef: string;
  sessionRef?: string;
  image?: string;
  startDate: string;
  endDate: string;
  venue?: string;
  city?: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  /** El evento/sesión usa control de asistencia (Premium) → el asistente recibe QR. */
  requiresAttendance: boolean;
  registeredAt: string;
}

export type CancelBlock = "canceled" | "finished" | "attended";

/** null = se puede cancelar; si no, la razón. Un check-in ya sellado no se cancela. */
export function cancelBlock(
  r: { status: RegistrationStatus; checkedIn?: boolean; endDate: string | Date },
  now = Date.now(),
): CancelBlock | null {
  if (r.status === "canceled") return "canceled";
  if (new Date(r.endDate).getTime() < now) return "finished";
  if (r.checkedIn) return "attended";
  return null;
}

/** El botón "Ver mi código QR" solo aplica a inscripciones vigentes con control de asistencia. */
export const canShowCheckInQr = (r: UserRegistrationItem, now = Date.now()) =>
  r.requiresAttendance && r.status !== "canceled" && new Date(r.endDate).getTime() >= now;

export const canCancel = (...args: Parameters<typeof cancelBlock>) => cancelBlock(...args) === null;

/** Etiqueta de estado para el asistente. */
export function statusLabel(r: { status: RegistrationStatus; checkedIn?: boolean }): string {
  if (r.status === "canceled") return "Cancelada";
  if (r.status === "accepted" || r.checkedIn) return "Asistencia confirmada";
  if (r.status === "waitlist") return "En lista de espera";
  return "Inscrito";
}

/**
 * Próximas (la más cercana primero; incluye las en curso) y pasadas (la más
 * reciente primero). Las canceladas de eventos futuros van a "pasadas"
 * para no ocupar la lista de pendientes.
 */
export function splitRegistrations(items: UserRegistrationItem[], now = Date.now()) {
  const t = (s: string) => new Date(s).getTime();
  const isUpcoming = (r: UserRegistrationItem) => r.status !== "canceled" && t(r.endDate) >= now;
  return {
    upcoming: items.filter(isUpcoming).sort((a, b) => t(a.startDate) - t(b.startDate)),
    past: items.filter((r) => !isUpcoming(r)).sort((a, b) => t(b.startDate) - t(a.startDate)),
  };
}

/** Contadores del encabezado: próximas vigentes y eventos a los que asistió. */
export function registrationCounts(items: UserRegistrationItem[], now = Date.now()) {
  const { upcoming, past } = splitRegistrations(items, now);
  return {
    upcoming: upcoming.length,
    attended: past.filter((r) => r.status === "accepted" || r.checkedIn).length,
  };
}
