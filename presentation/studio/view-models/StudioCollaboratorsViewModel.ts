import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";

/**
 * ViewModels de la sección "Colaboradores".
 * Datos MOCK por ahora (ver `lib/studioCollaboratorsMock.ts`).
 * Repos relacionados (stubs): getCollaborators, getReceivedInvitations,
 * inviteCollaborator, respondCollaboratorInvitation.
 */

export interface CollaboratorVM {
  uid: string;
  displayName: string;
  brandName?: string;
  photoURL?: string;
  professionalType: ProfessionalType;
}

export interface InvitationVM {
  id: string;
  fromDisplayName: string;
  fromBrandName?: string;
  fromPhotoURL?: string;
  professionalType: ProfessionalType;
  invitedAt: string; // ISO
}

export interface StudioCollaboratorsViewModel {
  /** Nombre de mi entidad (para mostrar "Invitas en nombre de …"). */
  myEntityName: string;
  /** Personas que colaboran con MI entidad (yo las invité). */
  collaborators: CollaboratorVM[];
  /** Entidades en las que YO soy colaborador. */
  entities: CollaboratorVM[];
  /** Invitaciones recibidas (entidades que me invitaron). */
  invitations: InvitationVM[];
}
