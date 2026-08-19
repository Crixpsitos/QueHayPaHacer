import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";
import type {
  SupportTicket,
  SupportTicketDetail,
  ExternalProfileType,
  ExternalSocialLinks,
} from "@/domain/entities/studio/Studio";

/**
 * Formas crudas de Firestore para las LECTURAS DE ENTIDAD del Studio.
 * El mapeo DTO → dominio vive en `StudioFirebaseMapper` (usado por `StudioAdapter`).
 * Los agregados (overview/stats/páginas) y mutaciones no pasan por aquí: no
 * tienen un DTO natural y se resuelven dentro del repo.
 */

export interface FirebaseSupportTicketDto {
  id: string;
  subject?: string;
  category?: string;
  status?: SupportTicket["status"];
  createdAt?: unknown;
}

export interface FirebaseSupportTicketDetailDto {
  id: string;
  subject?: string;
  category?: string;
  status?: SupportTicketDetail["status"];
  description?: string;
  attachments?: string[];
  closeReason?: string;
  createdAt?: unknown;
}

export interface FirebaseReceivedInviteDto {
  id: string;
  fromUid?: string;
  fromDisplayName?: string;
  fromPhotoURL?: string;
  fromProfessionalType?: ProfessionalType;
  createdAt?: unknown;
}

export interface FirebaseSentInviteDto {
  id: string;
  toUid?: string;
  toDisplayName?: string;
  toPhotoURL?: string;
  toEmail?: string;
  createdAt?: unknown;
}

/** Datos crudos ya filtrados (invitaciones aceptadas + externos) para armar la red. */
export interface StudioCollaboratorsRaw {
  sentAccepted: {
    toUid?: string;
    toDisplayName?: string;
    toPhotoURL?: string;
    toProfessionalType?: ProfessionalType;
  }[];
  receivedAccepted: {
    fromUid?: string;
    fromDisplayName?: string;
    fromPhotoURL?: string;
    fromProfessionalType?: ProfessionalType;
  }[];
  externals: { id: string; displayName?: string; photoURL?: string }[];
}

export interface FirebaseExternalProfileDto {
  id: string;
  displayName?: string;
  photoURL?: string | null;
  bio?: string | null;
  type?: ExternalProfileType;
  managedBy?: string;
  email?: string | null;
  socialLinks?: ExternalSocialLinks;
  createdAt?: unknown;
}
