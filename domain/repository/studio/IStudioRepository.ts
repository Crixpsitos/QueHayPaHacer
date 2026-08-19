import type {
  OrganizerOverview,
  GetOrganizerEventsParams,
  OrganizerEventsPage,
  EventRegistrationsResult,
  GetEventRegistrationsParams,
  EventStats,
  MultiDateEventStats,
  FormResponseAnswer,
  SiteAnalytics,
  SiteEventsPage,
  GetSiteEventsParams,
  OrganizerSiteListItem,
  GetStudioListParams,
  Collaborator,
  CollaboratorInvitation,
  SentInvitation,
  UserSearchItem,
  InviteeInput,
  ExternalProfile,
  ExternalProfileInput,
  CollaboratorKind,
  CollaboratorRole,
  AudienceSummary,
  SupportTicket,
  SupportTicketDetail,
  CreateSupportTicketInput,
} from "@/domain/entities/studio/Studio";

/**
 * Contrato del repositorio del Estudio del Organizador.
 * La implementación Firebase queda como stubs (la implementa el desarrollador).
 */
export interface IStudioRepository {
  // Resumen
  getOrganizerOverview(uid: string): Promise<OrganizerOverview | null>;

  // Eventos / registros
  /** Lista paginada de "Mis eventos" (tabla del organizador). Ver `GetOrganizerEventsParams`. */
  getOrganizerEvents(uid: string, params: GetOrganizerEventsParams): Promise<OrganizerEventsPage>;
  getEventRegistrations(
    eventId: string,
    params?: GetEventRegistrationsParams,
    sessionId?: string,
  ): Promise<EventRegistrationsResult | null>;
  /** `sessionId` apunta las métricas a `events/{id}/sessions/{sid}` en vez del evento. */
  getEventStats(eventId: string, sessionId?: string): Promise<EventStats | null>;
  /**
   * Analíticas de un evento multi-date (padre + sesiones + acumulado) en una
   * sola query. `getEventStats` no sirve aquí: asume un evento con fecha,
   * registro y lugar propios, que en multi-date viven en cada sesión.
   */
  getMultiDateEventStats(eventId: string): Promise<MultiDateEventStats | null>;
  confirmAttendance(eventId: string, userId: string, sessionId?: string): Promise<void>;
  removeParticipant(eventId: string, userId: string, sessionId?: string): Promise<void>;
  incrementExternalRegistrationClick(eventId: string): Promise<void>;
  getFormResponses(eventId: string, userId: string): Promise<FormResponseAnswer[]>;

  // Sitios
  /** Grid de "Sitios" del organizador. Pipeline con búsqueda + límite, sin paginación. */
  getOrganizerSites(uid: string, params?: GetStudioListParams): Promise<OrganizerSiteListItem[]>;
  getSiteAnalytics(siteId: string): Promise<SiteAnalytics | null>;
  /** Itinerario de eventos de un sitio (FK `location.siteId`). Pipeline con búsqueda + paginación por cursor. */
  getEventsBySite(siteId: string, params?: GetSiteEventsParams): Promise<SiteEventsPage>;

  // Colaboradores (red a nivel de cuenta)
  /** Busca usuarios para invitar (pipeline de búsqueda sobre `users`). Excluye a uno mismo. */
  searchPotentialCollaborators(uid: string, query: string, limit?: number): Promise<UserSearchItem[]>;
  /** Envía invitaciones a varios usuarios a la vez (a mi red). Dedup + no auto-invitar. */
  inviteCollaborators(fromUid: string, invitees: InviteeInput[]): Promise<void>;
  /** Invitaciones pendientes que YO recibí. */
  getReceivedInvitations(uid: string): Promise<CollaboratorInvitation[]>;
  /** Invitaciones pendientes que YO envié (para poder cancelarlas). */
  getSentInvitations(uid: string): Promise<SentInvitation[]>;
  /** Mi red: usuarios que invité y aceptaron + mis perfiles externos. */
  getCollaborators(uid: string): Promise<Collaborator[]>;
  /** Aceptar/rechazar una invitación recibida. `uid` debe ser el invitado (`toUid`). */
  respondCollaboratorInvitation(inviteId: string, uid: string, accept: boolean): Promise<void>;
  /** Cancelar una invitación que YO envié (pendiente). `uid` = quien invitó (`fromUid`). */
  cancelInvitation(inviteId: string, uid: string): Promise<void>;
  /** Quitar de mi red a un colaborador (user aceptado o externo mío). */
  removeCollaborator(uid: string, refId: string, kind: CollaboratorKind): Promise<void>;
  /**
   * Crea un perfil externo (cara sin login) gestionado por `managedBy`; entra a
   * mi red. La imagen ya viene subida a Storage (`photoURL`); el upload va en la action.
   */
  createExternalProfile(
    managedBy: string,
    input: ExternalProfileInput,
    photoURL: string | undefined,
  ): Promise<ExternalProfile>;
  /** Detalle de un perfil externo por id (para el modal de créditos del evento). */
  getExternalProfile(id: string): Promise<ExternalProfile | null>;
  /**
   * Acredita a un miembro de mi red en un evento (con rol). Op atómica
   * (arrayUnion + nested set); no pasa por el save del evento. Solo el owner.
   */
  addCollaboratorToEvent(
    eventId: string,
    member: {
      refId: string;
      kind: CollaboratorKind;
      displayName: string;
      photoURL?: string;
      role: CollaboratorRole;
    },
    actingUid: string,
  ): Promise<void>;
  /** Quitar un colaborador acreditado de un evento (solo el owner del evento). */
  removeCollaboratorFromEvent(eventId: string, refId: string, actingUid: string): Promise<void>;

  // Audiencia
  getAudienceSummary(uid: string): Promise<AudienceSummary | null>;

  // Soporte
  getSupportTickets(uid: string): Promise<SupportTicket[]>;
  /** uid: dueño de la sesión — devuelve null si el ticket no es suyo. */
  getSupportTicketDetail(ticketId: string, uid: string): Promise<SupportTicketDetail | null>;
  /** Devuelve el id del ticket creado. */
  createSupportTicket(uid: string, input: CreateSupportTicketInput): Promise<string>;
  closeSupportTicket(ticketId: string, uid: string, reason: string): Promise<void>;
}
