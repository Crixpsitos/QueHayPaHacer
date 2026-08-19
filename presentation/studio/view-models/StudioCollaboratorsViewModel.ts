/**
 * ViewModels de la sección "Colaboradores" del Estudio (hub de gestión).
 * Red a nivel de cuenta: invitar usuarios, ver invitaciones enviadas/recibidas y
 * gestionar mi red (aceptados + perfiles externos).
 */

export interface InvitationVM {
  id: string;
  fromUid: string;
  fromDisplayName: string;
  fromPhotoURL?: string;
  fromProfessionalType?: "organizer" | "business" | "government";
  invitedAt: string; // ISO
}

export interface SentInvitationVM {
  id: string;
  toDisplayName: string;
  toPhotoURL?: string;
  toEmail: string;
  invitedAt: string; // ISO
}

export interface CollaboratorVM {
  refId: string;
  kind: "user" | "external";
  displayName: string;
  photoURL?: string;
  professionalType?: "organizer" | "business" | "government";
}

export interface StudioCollaboratorsViewModel {
  received: InvitationVM[];
  sent: SentInvitationVM[];
  network: CollaboratorVM[];
}
