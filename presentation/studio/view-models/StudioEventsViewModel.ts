import type { EventAccessRole, TeamAction, TeamRole } from "@/domain/entities/events/teamAccess";
import type { RegistrationType, RampUnit, RegistrationRampPoint } from "@/domain/entities/studio/Studio";

export interface TeamMemberVM {
  refId: string;
  displayName: string;
  photoURL?: string;
  kind: "user" | "external";
  role: "owner" | TeamRole;
}

/**
 * ViewModels de la sección "Mis eventos" del Estudio.
 * Las fechas van como ISO string para poder serializarlas server→client.
 */

export interface StudioEventListItem {
  id: string;
  name: string;
  date: string | null; // ISO — null si el evento no tiene fecha de inicio
  status: string;
  image?: string;
  views: number;
  registrations: number;
  registrationType: RegistrationType;
}

export interface RegistrationRow {
  userId: string;
  /** Nombre completo a mostrar (firstName + lastName, o el mejor disponible). */
  name: string;
  /** Username opcional, se muestra como "@handle" de forma sutil. */
  handle?: string;
  /** Participa como creador. */
  isCreator?: boolean;
  photoURL?: string;
  registeredAt: string; // ISO
  attendanceConfirmed: boolean;
  /** Solo en eventos tipo "form". */
  formResponses?: { label: string; value: string }[];
}

export interface EventStatsViewModel {
  eventId: string;
  name: string;
  status: string;
  date: string; // ISO
  registrationType: RegistrationType;
  views: number;
  registrations: number;
  /** Clics al botón de registro externo (solo relevante para eventos "external"). */
  clicks: number;
  likes: number;
  shares: number;
  score: number;
  /** Unidad del eje de la curva de ritmo ("hour" | "day"). */
  rampUnit: RampUnit;
  registrationRamp: RegistrationRampPoint[];
  /** Rol de quien mira el Studio (calculado en servidor). */
  viewerRole: EventAccessRole;
  /** Permisos del rol: la UI solo oculta, el servidor autoriza. */
  permissions: Record<TeamAction, boolean>;
}

export interface EventRegistrationsViewModel {
  eventId: string;
  registrationType: RegistrationType;
  /** internal | form */
  rows: RegistrationRow[];
  /** external */
  externalClicks?: number;
  externalUrl?: string;
  /** Si el evento lleva control de asistencia (check-in) de los inscritos. */
  requiresAttendance: boolean;
  /** Cursor de paginación: `null` si no hay página en esa dirección. */
  nextCursor: string | null;
  prevCursor: string | null;
  /** Rol de quien mira. Sin `view_attendee_contact`, `formResponses` ya viene vacío desde el servidor. */
  viewerRole: EventAccessRole;
  permissions: Record<TeamAction, boolean>;
}
