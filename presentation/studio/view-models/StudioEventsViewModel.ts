import type { RegistrationType, RampUnit, RegistrationRampPoint } from "@/domain/entities/studio/Studio";
import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";

export interface TeamMemberVM {
  uid: string;
  displayName: string;
  brandName?: string;
  photoURL?: string;
  professionalType: ProfessionalType;
  role: "owner" | "collaborator";
}

/**
 * ViewModels de la sección "Mis eventos" del Estudio.
 * Las fechas van como ISO string para poder serializarlas server→client.
 * Datos MOCK por ahora (ver `lib/studioEventsMock.ts`).
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
  /** Cuenta profesional: muestra el chulito de verificado junto al nombre. */
  verified?: boolean;
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
  /** Dueño (role: "owner") + colaboradores del evento. */
  team: TeamMemberVM[];
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
}
