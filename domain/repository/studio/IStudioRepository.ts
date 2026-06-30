import type {
  OrganizerOverview,
  GetOrganizerEventsParams,
  OrganizerEventsPage,
  EventRegistrationsResult,
  GetEventRegistrationsParams,
  EventStats,
  FormResponseAnswer,
  SiteAnalytics,
  SiteEvent,
  Collaborator,
  CollaboratorInvitation,
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
  ): Promise<EventRegistrationsResult | null>;
  getEventStats(eventId: string): Promise<EventStats | null>;
  confirmAttendance(eventId: string, userId: string): Promise<void>;
  removeParticipant(eventId: string, userId: string): Promise<void>;
  incrementExternalRegistrationClick(eventId: string): Promise<void>;
  getFormResponses(eventId: string, userId: string): Promise<FormResponseAnswer[]>;

  // Sitios
  getSiteAnalytics(siteId: string): Promise<SiteAnalytics | null>;
  getEventsBySite(siteId: string): Promise<SiteEvent[]>;

  // Colaboradores
  /** Personas que colaboran con MI entidad (yo las invité). */
  getCollaborators(uid: string): Promise<Collaborator[]>;
  /** Entidades en las que YO soy colaborador (me invitaron y acepté). */
  getMemberEntities(uid: string): Promise<Collaborator[]>;
  getReceivedInvitations(uid: string): Promise<CollaboratorInvitation[]>;
  inviteCollaborator(uid: string, email: string): Promise<void>;
  respondCollaboratorInvitation(invitationId: string, accept: boolean): Promise<void>;
  /** Quitar a alguien de MI entidad. */
  removeCollaborator(uid: string, collaboratorUid: string): Promise<void>;
  /** Salirme de una entidad en la que colaboro. */
  leaveEntity(uid: string, entityUid: string): Promise<void>;

  // Audiencia
  getAudienceSummary(uid: string): Promise<AudienceSummary | null>;

  // Soporte
  getSupportTickets(uid: string): Promise<SupportTicket[]>;
  getSupportTicketDetail(ticketId: string): Promise<SupportTicketDetail | null>;
  createSupportTicket(uid: string, input: CreateSupportTicketInput): Promise<void>;
  closeSupportTicket(ticketId: string, reason: string): Promise<void>;
}
