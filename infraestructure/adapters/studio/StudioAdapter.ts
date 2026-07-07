import type { IStudioRepository } from "@/domain/repository/studio/IStudioRepository";
import type {
  OrganizerOverview,
  GetOrganizerEventsParams,
  OrganizerEventsPage,
  EventRegistrationsResult,
  GetEventRegistrationsParams,
  EventStats,
  FormResponseAnswer,
  SiteAnalytics,
  SiteEventsPage,
  GetSiteEventsParams,
  OrganizerSiteListItem,
  GetStudioListParams,
  Collaborator,
  CollaboratorInvitation,
  AudienceSummary,
  SupportTicket,
  SupportTicketDetail,
  CreateSupportTicketInput,
} from "@/domain/entities/studio/Studio";

/**
 * Adapter del Studio: expone el contrato de dominio y delega en el repositorio
 * Firebase. Cuando el repo devuelva DTOs crudos, aquí se aplicaría el
 * `StudioFirebaseMapper` para convertirlos a entidades de dominio.
 */
export class StudioAdapter implements IStudioRepository {
  constructor(private readonly repository: IStudioRepository) {}

  getOrganizerOverview(uid: string): Promise<OrganizerOverview | null> {
    return this.repository.getOrganizerOverview(uid);
  }

  getOrganizerEvents(uid: string, params: GetOrganizerEventsParams): Promise<OrganizerEventsPage> {
    return this.repository.getOrganizerEvents(uid, params);
  }

  getEventRegistrations(
    eventId: string,
    params?: GetEventRegistrationsParams,
  ): Promise<EventRegistrationsResult | null> {
    return this.repository.getEventRegistrations(eventId, params);
  }

  getEventStats(eventId: string): Promise<EventStats | null> {
    return this.repository.getEventStats(eventId);
  }

  confirmAttendance(eventId: string, userId: string): Promise<void> {
    return this.repository.confirmAttendance(eventId, userId);
  }

  removeParticipant(eventId: string, userId: string): Promise<void> {
    return this.repository.removeParticipant(eventId, userId);
  }

  incrementExternalRegistrationClick(eventId: string): Promise<void> {
    return this.repository.incrementExternalRegistrationClick(eventId);
  }

  getFormResponses(eventId: string, userId: string): Promise<FormResponseAnswer[]> {
    return this.repository.getFormResponses(eventId, userId);
  }

  getOrganizerSites(uid: string, params?: GetStudioListParams): Promise<OrganizerSiteListItem[]> {
    return this.repository.getOrganizerSites(uid, params);
  }

  getSiteAnalytics(siteId: string): Promise<SiteAnalytics | null> {
    return this.repository.getSiteAnalytics(siteId);
  }

  getEventsBySite(siteId: string, params?: GetSiteEventsParams): Promise<SiteEventsPage> {
    return this.repository.getEventsBySite(siteId, params);
  }

  getCollaborators(uid: string): Promise<Collaborator[]> {
    return this.repository.getCollaborators(uid);
  }

  getMemberEntities(uid: string): Promise<Collaborator[]> {
    return this.repository.getMemberEntities(uid);
  }

  getReceivedInvitations(uid: string): Promise<CollaboratorInvitation[]> {
    return this.repository.getReceivedInvitations(uid);
  }

  inviteCollaborator(uid: string, email: string): Promise<void> {
    return this.repository.inviteCollaborator(uid, email);
  }

  respondCollaboratorInvitation(invitationId: string, accept: boolean): Promise<void> {
    return this.repository.respondCollaboratorInvitation(invitationId, accept);
  }

  removeCollaborator(uid: string, collaboratorUid: string): Promise<void> {
    return this.repository.removeCollaborator(uid, collaboratorUid);
  }

  leaveEntity(uid: string, entityUid: string): Promise<void> {
    return this.repository.leaveEntity(uid, entityUid);
  }

  getAudienceSummary(uid: string): Promise<AudienceSummary | null> {
    return this.repository.getAudienceSummary(uid);
  }

  getSupportTickets(uid: string): Promise<SupportTicket[]> {
    return this.repository.getSupportTickets(uid);
  }

  getSupportTicketDetail(ticketId: string): Promise<SupportTicketDetail | null> {
    return this.repository.getSupportTicketDetail(ticketId);
  }

  createSupportTicket(uid: string, input: CreateSupportTicketInput): Promise<void> {
    return this.repository.createSupportTicket(uid, input);
  }

  closeSupportTicket(ticketId: string, reason: string): Promise<void> {
    return this.repository.closeSupportTicket(ticketId, reason);
  }
}
