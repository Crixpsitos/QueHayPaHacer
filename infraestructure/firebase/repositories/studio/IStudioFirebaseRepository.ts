import type { IStudioRepository } from "@/domain/repository/studio/IStudioRepository";
import type {
  FirebaseSupportTicketDto,
  FirebaseSupportTicketDetailDto,
  FirebaseReceivedInviteDto,
  FirebaseSentInviteDto,
  StudioCollaboratorsRaw,
  FirebaseExternalProfileDto,
} from "@/infraestructure/firebase/dto/studio/FirebaseStudioDto";

/**
 * Puerto de infraestructura del Studio. Idéntico al puerto de dominio salvo las
 * LECTURAS DE ENTIDAD, que devuelven DTOs crudos: su mapeo a dominio vive en
 * `StudioAdapter` (vía `StudioFirebaseMapper`). El resto (agregados y mutaciones)
 * no tiene DTO natural y devuelve dominio directo, así que pasa por el adapter.
 */
type EntityReads =
  | "getSupportTickets"
  | "getSupportTicketDetail"
  | "getReceivedInvitations"
  | "getSentInvitations"
  | "getCollaborators"
  | "getExternalProfile";

export interface IStudioFirebaseRepository extends Omit<IStudioRepository, EntityReads> {
  getSupportTickets(uid: string): Promise<FirebaseSupportTicketDto[]>;
  getSupportTicketDetail(
    ticketId: string,
    uid: string,
  ): Promise<FirebaseSupportTicketDetailDto | null>;
  getReceivedInvitations(uid: string): Promise<FirebaseReceivedInviteDto[]>;
  getSentInvitations(uid: string): Promise<FirebaseSentInviteDto[]>;
  getCollaborators(uid: string): Promise<StudioCollaboratorsRaw>;
  getExternalProfile(id: string): Promise<FirebaseExternalProfileDto | null>;
}
