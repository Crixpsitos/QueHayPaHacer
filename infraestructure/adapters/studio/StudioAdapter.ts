import type { IStudioRepository } from "@/domain/repository/studio/IStudioRepository";
import type { IStudioFirebaseRepository } from "@/infraestructure/firebase/repositories/studio/IStudioFirebaseRepository";
import type { StudioFirebaseMapper } from "@/infraestructure/firebase/mappers/studio/StudioFirebaseMapper";
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
 * Adapter del Studio: puerto de dominio. Las LECTURAS DE ENTIDAD llegan como
 * DTO crudo del repo y se mapean aquí con `StudioFirebaseMapper`. Los agregados
 * (overview/stats/páginas) y las mutaciones no tienen DTO natural: el repo ya
 * los devuelve en dominio y el adapter solo delega.
 */
export class StudioAdapter implements IStudioRepository {
  constructor(
    private readonly repository: IStudioFirebaseRepository,
    private readonly mapper: StudioFirebaseMapper,
  ) {}

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

  // --- Lecturas de entidad: DTO crudo → dominio vía el mapper. ---

  async getReceivedInvitations(uid: string): Promise<CollaboratorInvitation[]> {
    const dtos = await this.repository.getReceivedInvitations(uid);
    return dtos.map((dto) => this.mapper.toReceivedInvitation(dto));
  }

  async getSentInvitations(uid: string): Promise<SentInvitation[]> {
    const dtos = await this.repository.getSentInvitations(uid);
    return dtos.map((dto) => this.mapper.toSentInvitation(dto));
  }

  async getCollaborators(uid: string): Promise<Collaborator[]> {
    const raw = await this.repository.getCollaborators(uid);
    return this.mapper.toCollaborators(raw);
  }

  async getExternalProfile(id: string): Promise<ExternalProfile | null> {
    const dto = await this.repository.getExternalProfile(id);
    return dto ? this.mapper.toExternalProfile(dto) : null;
  }

  async getSupportTickets(uid: string): Promise<SupportTicket[]> {
    const dtos = await this.repository.getSupportTickets(uid);
    // ponytail: orden en memoria para no exigir índice compuesto (uid + createdAt).
    return dtos
      .map((dto) => this.mapper.toSupportTicket(dto))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSupportTicketDetail(ticketId: string, uid: string): Promise<SupportTicketDetail | null> {
    const dto = await this.repository.getSupportTicketDetail(ticketId, uid);
    return dto ? this.mapper.toSupportTicketDetail(dto) : null;
  }

  // --- Mutaciones (sin mapeo: el repo ya opera en dominio). ---

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

  createSupportTicket(uid: string, input: CreateSupportTicketInput): Promise<string> {
    return this.repository.createSupportTicket(uid, input);
  }

  closeSupportTicket(ticketId: string, uid: string, reason: string): Promise<void> {
    return this.repository.closeSupportTicket(ticketId, uid, reason);
  }
}
