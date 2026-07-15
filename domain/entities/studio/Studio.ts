import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";

/**
 * Tipos de dominio del "Estudio del Organizador".
 * En esta fase sólo se consume `OrganizerOverview`; el resto queda definido
 * para que las firmas del repositorio (stubs) compilen y guíen las fases siguientes.
 */

/** Coincide con el `registrationType` inline de `domain/entities/events/Events.ts`. */
export type RegistrationType = "none" | "internal" | "external" | "form";

export interface OrganizerKpis {
  totalViews: number;
  previousMonthViews: number;
  totalRegistrations: number;
  previousMonthRegistrations: number;
  totalLikes: number;
  previousMonthLikes: number;
  activeEvents: number;
  previousMonthActiveEvents: number;
  /** Variación porcentual vs período anterior (puede ser negativa). */
  viewsChangePct: number;
  registrationsChangePct: number;
  likesChangePct: number;
  activeEventsChangePct: number;
}

export interface EventComparisonPoint {
  eventId: string;
  eventName: string;
  views: number;
  registrations: number;
}

export interface RegistrationTimelinePoint {
  /** Fecha calendario (ISO o label corto), agregando todos los eventos del organizador. */
  date: string;
  registrations: number;
}

export interface OrganizerEventListItem {
  eventId: string;
  name: string;
  status: string;
  /** `null` si el evento no tiene fecha de inicio (`startDate`). */
  date: Date | null;
  image?: string;
  views: number;
  registrations: number;
  registrationType: RegistrationType;
  /** Usado solo como cursor de paginación, no se expone en la UI. */
  createdAt: Date;
}

export interface GetOrganizerEventsParams {
  limit: number;
  /** ISO de `createdAt` del evento límite de la página actual (primero o último, según `direction`). */
  cursor?: string;
  /** "next" pide los eventos más viejos que el cursor; "prev" los más nuevos. Ignorado sin `cursor`. */
  direction?: "next" | "prev";

  /** query de búsqueda por nombre de evento (opcional). */
  search?: string;
}

export interface OrganizerEventsPage {
  events: OrganizerEventListItem[];
  /** ISO de `createdAt` a pasar como `cursor` con direction "next". `null` si no hay más páginas. */
  nextCursor: string | null;
  /** ISO de `createdAt` a pasar como `cursor` con direction "prev". `null` si ya estás en la primera página. */
  prevCursor: string | null;
}

/**
 * Unidad del eje de la curva de ritmo de inscripción. Se elige según el
 * horizonte del evento: "hour" para eventos de corto plazo (≤48 h desde la
 * primera inscripción), "day" para los de varios días.
 */
export type RampUnit = "hour" | "day";

/** Un punto de la curva: cuántas unidades (horas/días) antes del evento. */
export interface RegistrationRampPoint {
  unitsBeforeEvent: number;
  cumulativeRegistrations: number;
}

/** Estadísticas/detalle de un evento individual (header + panel de stats). */
export interface EventStats {
  eventId: string;
  name: string;
  status: string;
  date: Date;
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
}

/** Contadores de una sesión dentro del desglose de un evento multi-date. */
export interface MultiDateSessionStats {
  sessionId: string;
  title: string;
  status: string;
  startDate: Date | null;
  /** Portada ya resuelta según `coverSource` (propia, del padre u otra sesión). */
  image?: string;
  likes: number;
  views: number;
  registrations: number;
}

/**
 * Analíticas de un evento multi-date: los contadores del evento padre y los de
 * cada sesión, más el acumulado (padre + sesiones).
 *
 * Un multi-date no tiene fecha/lugar/registro propios (viven en las sesiones),
 * así que `EventStats` — pensado para un evento único — no le sirve.
 */
export interface MultiDateEventStats {
  eventId: string;
  name: string;
  status: string;
  /** Portada del evento padre. */
  image?: string;
  /** Contadores del documento del evento (los del "encabezado"). */
  event: {
    likes: number;
    views: number;
    registrations: number;
    shares: number;
    score: number;
  };
  sessions: MultiDateSessionStats[];
  /** Acumulado: evento + todas sus sesiones. */
  totals: {
    likes: number;
    views: number;
    registrations: number;
  };
}

export interface TopEvent {
  eventId: string;
  name: string;
  score: number;
  views: number;
}

export interface InteractivityPoint {
  eventName: string;
  views: number;
  likes: number;
  shares: number;
}

export interface OrganizerOverview {
  kpis: OrganizerKpis;
  viewsVsRegistrations: EventComparisonPoint[];
  registrationsTimeline: RegistrationTimelinePoint[];
  topEvents: TopEvent[];
  interactivity: InteractivityPoint[];
}

/** Una persona inscrita a un evento (registro interno o por formulario). */
export interface EventRegistration {
  userId: string;
  firstName: string;
  lastName: string;
  /** Nombre de usuario opcional (se muestra como "@handle"). */
  displayName?: string;
  photoURL?: string;
  /** True si la cuenta es profesional (accountType === "professional"). */
  isProfessional: boolean;
  registeredAt: Date;
  attendanceConfirmed: boolean;
  /** Respuestas del formulario (solo para eventos tipo "form"). */
  formResponses?: FormResponseAnswer[];
}

export interface FormResponseAnswer {
  fieldId: string;
  label: string;
  value: string;
}

export interface EventRegistrationsResult {
  registrationType: RegistrationType;
  /** Para tipo "internal" y "form". */
  registrations: EventRegistration[];
  /** Si el organizador lleva control de asistencia (check-in) en este evento. */
  requiresAttendance: boolean;
  /** Para tipo "external": clicks al botón de registro externo. */
  externalClicks?: number;
  externalUrl?: string;
  /** Cursor (valor del campo de orden de la última fila) para "Siguiente". `null` si no hay más. */
  nextCursor: string | null;
  /** Cursor de la primera fila para "Anterior". `null` si ya estás en la primera página. */
  prevCursor: string | null;
}

/** Campo por el que se ordena la tabla de participantes. */
export type RegistrationSortBy = "name" | "registeredAt";

export interface GetEventRegistrationsParams {
  /** "name" ordena por el nombre guardado en la inscripción; "registeredAt" por fecha. */
  sortBy?: RegistrationSortBy;
  sortDir?: "asc" | "desc";
  /** Tamaño de página (cuántas inscripciones por página). */
  limit?: number;
  /** Cursor: valor del campo de orden de la fila límite de la página actual. */
  cursor?: string;
  /** "next" avanza en el orden de despliegue; "prev" retrocede. Ignorado sin `cursor`. */
  direction?: "next" | "prev";
  /** Búsqueda full-text por nombre del inscrito (opcional). */
  search?: string;
}

/** Un bucket semanal de interacciones del sitio. */
export interface SiteInteractionsPoint {
  /** ISO (YYYY-MM-DD) del inicio del bucket semanal. */
  weekStart: string;
  clicks: number;
  likes: number;
  shares: number;
}

export interface SiteAnalytics {
  siteId: string;
  name: string;
  category: string;
  image?: string;
  totalClicks: number;
  totalLikes: number;
  totalShares: number;
  /** Interacciones (clicks + likes + shares) por semana en la ventana reciente. */
  interactionsOverTime: SiteInteractionsPoint[];
  eventsCount: number;
}

export interface SiteEvent {
  eventId: string;
  name: string;
  /** `startDate` del evento; `null` si no tiene fecha de inicio. */
  date: Date | null;
  status: string;
  image?: string;
  views: number;
  registrations: number;
}

/**
 * Parámetros del itinerario de eventos de un sitio: búsqueda + paginación por
 * cursor (mismo patrón que `getOrganizerEvents`). El cursor es el `createdAt`
 * (ISO) del evento límite de la página.
 */
export interface GetSiteEventsParams {
  limit?: number;
  /** ISO de `createdAt` del evento límite de la página actual. */
  cursor?: string;
  /** "next" pide eventos más viejos que el cursor; "prev" los más nuevos. Ignorado sin `cursor`. */
  direction?: "next" | "prev";
  search?: string;
}

export interface SiteEventsPage {
  events: SiteEvent[];
  /** ISO de `createdAt` a pasar como `cursor` con direction "next". `null` si no hay más. */
  nextCursor: string | null;
  /** ISO de `createdAt` a pasar como `cursor` con direction "prev". `null` si es la primera página. */
  prevCursor: string | null;
}

/** Item del grid de "Sitios" del Estudio (lista). */
export interface OrganizerSiteListItem {
  id: string;
  name: string;
  category: string;
  image?: string;
  clicks: number;
  likes: number;
  shares: number;
  eventsCount: number;
  /** MOCK: tendencia semanal (%). Placeholder para probar la UI; aún no se calcula real. */
  trend: number;
}

/** Parámetros comunes de las listas del Estudio: búsqueda full-text + tope. Sin paginación. */
export interface GetStudioListParams {
  search?: string;
  limit?: number;
}

export interface Collaborator {
  uid: string;
  displayName: string;
  brandName?: string;
  photoURL?: string;
  professionalType: ProfessionalType;
}

/** Invitación de colaboración recibida (alguien me invitó a colaborar). */
export interface CollaboratorInvitation {
  id: string;
  fromUid: string;
  fromDisplayName: string;
  fromBrandName?: string;
  fromPhotoURL?: string;
  professionalType: ProfessionalType;
  invitedAt: Date;
}

export interface AudienceSummary {
  totalFollowers: number;
  totalInterested: number;
  growth: { date: string; followers: number }[];
}

export type SupportTicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  createdAt: Date;
}

export interface SupportMessage {
  id: string;
  author: "user" | "admin";
  authorName: string;
  message: string;
  createdAt: Date;
}

export interface SupportTicketDetail extends SupportTicket {
  description: string;
  attachments: string[];
  messages: SupportMessage[];
  /** Motivo por el que se cerró el ticket (si aplica). */
  closeReason?: string;
}

export interface CreateSupportTicketInput {
  subject: string;
  category: string;
  description: string;
  attachments?: string[];
}
