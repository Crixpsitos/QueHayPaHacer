import type { IStudioRepository } from "@/domain/repository/studio/IStudioRepository";
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
    sessionId?: string,
  ): Promise<EventRegistrationsResult | null> {
    return this.repository.getEventRegistrations(eventId, params, sessionId);
  }

  getEventStats(eventId: string, sessionId?: string): Promise<EventStats | null> {
    return this.repository.getEventStats(eventId, sessionId);
  }

  getMultiDateEventStats(eventId: string): Promise<MultiDateEventStats | null> {
    return this.repository.getMultiDateEventStats(eventId);
  }

  confirmAttendance(eventId: string, userId: string, sessionId?: string): Promise<void> {
    return this.repository.confirmAttendance(eventId, userId, sessionId);
  }

  removeParticipant(eventId: string, userId: string, sessionId?: string): Promise<void> {
    return this.repository.removeParticipant(eventId, userId, sessionId);
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

  searchPotentialCollaborators(uid: string, query: string, limit?: number): Promise<UserSearchItem[]> {
    return this.repository.searchPotentialCollaborators(uid, query, limit);
  }

  inviteCollaborators(fromUid: string, invitees: InviteeInput[]): Promise<void> {
    return this.repository.inviteCollaborators(fromUid, invitees);
  }

  getReceivedInvitations(uid: string): Promise<CollaboratorInvitation[]> {
    return this.repository.getReceivedInvitations(uid);
  }

  getSentInvitations(uid: string): Promise<SentInvitation[]> {
    return this.repository.getSentInvitations(uid);
  }

  getCollaborators(uid: string): Promise<Collaborator[]> {
    return this.repository.getCollaborators(uid);
  }

  respondCollaboratorInvitation(inviteId: string, uid: string, accept: boolean): Promise<void> {
    return this.repository.respondCollaboratorInvitation(inviteId, uid, accept);
  }

  cancelInvitation(inviteId: string, uid: string): Promise<void> {
    return this.repository.cancelInvitation(inviteId, uid);
  }

  removeCollaborator(uid: string, refId: string, kind: CollaboratorKind): Promise<void> {
    return this.repository.removeCollaborator(uid, refId, kind);
  }

  createExternalProfile(
    managedBy: string,
    input: ExternalProfileInput,
    photoURL: string | undefined,
  ): Promise<ExternalProfile> {
    return this.repository.createExternalProfile(managedBy, input, photoURL);
  }

  getExternalProfile(id: string): Promise<ExternalProfile | null> {
    return this.repository.getExternalProfile(id);
  }

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
  ): Promise<void> {
    return this.repository.addCollaboratorToEvent(eventId, member, actingUid);
  }

  removeCollaboratorFromEvent(eventId: string, refId: string, actingUid: string): Promise<void> {
    return this.repository.removeCollaboratorFromEvent(eventId, refId, actingUid);
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
