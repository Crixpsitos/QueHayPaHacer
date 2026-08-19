import { Timestamp } from "firebase-admin/firestore";
import type {
  EventRegistration,
  EventRegistrationsResult,
  RegistrationType,
  SupportTicket,
  SupportTicketDetail,
  CollaboratorInvitation,
  SentInvitation,
  Collaborator,
  ExternalProfile,
} from "@/domain/entities/studio/Studio";
import type {
  FirebaseSupportTicketDto,
  FirebaseSupportTicketDetailDto,
  FirebaseReceivedInviteDto,
  FirebaseSentInviteDto,
  StudioCollaboratorsRaw,
  FirebaseExternalProfileDto,
} from "@/infraestructure/firebase/dto/studio/FirebaseStudioDto";

/**
 * Formas crudas tal como (previsiblemente) vivirán en Firestore.
 * Cuando implementes el repositorio, ajusta estos shapes a tus documentos reales.
 */
export interface FirebaseEventRegistrationDto {
  userId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  photoURL?: string;
  accountType?: string;
  registeredAt: Timestamp;
  attendanceConfirmed?: boolean;
  formResponses?: { fieldId: string; label: string; value: string }[];
}

export interface FirebaseEventRegistrationsDto {
  registrationType: RegistrationType;
  registrations?: FirebaseEventRegistrationDto[];
  externalClicks?: number;
  externalUrl?: string;
  requiresAttendance?: boolean;
}

/**
 * Mapper: documentos crudos de Firestore → entidades de dominio del Studio.
 */
export class StudioFirebaseMapper {
  static toRegistration(dto: FirebaseEventRegistrationDto): EventRegistration {
    return {
      userId: dto.userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: dto.displayName,
      photoURL: dto.photoURL,
      isProfessional: dto.accountType === "professional",
      registeredAt: dto.registeredAt.toDate(),
      attendanceConfirmed: dto.attendanceConfirmed ?? false,
      formResponses: dto.formResponses,
    };
  }

  static toRegistrationsResult(
    dto: FirebaseEventRegistrationsDto,
  ): EventRegistrationsResult {
    return {
      registrationType: dto.registrationType,
      registrations: (dto.registrations ?? []).map((r) => this.toRegistration(r)),
      externalClicks: dto.externalClicks,
      externalUrl: dto.externalUrl,
      requiresAttendance: dto.requiresAttendance ?? false,
      nextCursor: null,
      prevCursor: null,
    };
  }

  // --- Lecturas de entidad (DTO crudo → dominio). Usadas por StudioAdapter. ---

  toSupportTicket(dto: FirebaseSupportTicketDto): SupportTicket {
    return {
      id: dto.id,
      subject: dto.subject ?? "",
      category: dto.category ?? "",
      status: dto.status ?? "open",
      createdAt: this.toDateOrNull(dto.createdAt) ?? new Date(0),
    };
  }

  toSupportTicketDetail(dto: FirebaseSupportTicketDetailDto): SupportTicketDetail {
    return {
      id: dto.id,
      subject: dto.subject ?? "",
      category: dto.category ?? "",
      status: dto.status ?? "open",
      description: dto.description ?? "",
      attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
      closeReason: dto.closeReason || undefined,
      createdAt: this.toDateOrNull(dto.createdAt) ?? new Date(0),
    };
  }

  toReceivedInvitation(dto: FirebaseReceivedInviteDto): CollaboratorInvitation {
    return {
      id: dto.id,
      fromUid: dto.fromUid ?? "",
      fromDisplayName: dto.fromDisplayName || "Organizador",
      fromPhotoURL: dto.fromPhotoURL ?? undefined,
      fromProfessionalType: dto.fromProfessionalType ?? undefined,
      invitedAt: this.toDateOrNull(dto.createdAt) ?? new Date(0),
    };
  }

  toSentInvitation(dto: FirebaseSentInviteDto): SentInvitation {
    return {
      id: dto.id,
      toUid: dto.toUid ?? "",
      toDisplayName: dto.toDisplayName || dto.toEmail || "Usuario",
      toPhotoURL: dto.toPhotoURL ?? undefined,
      toEmail: dto.toEmail ?? "",
      invitedAt: this.toDateOrNull(dto.createdAt) ?? new Date(0),
    };
  }

  /** Arma la red bidireccional (invité+acepté / me invitaron+acepté / externos), dedup por refId. */
  toCollaborators(raw: StudioCollaboratorsRaw): Collaborator[] {
    const asInviter: Collaborator[] = raw.sentAccepted.map((inv) => ({
      refId: inv.toUid ?? "",
      kind: "user",
      displayName: inv.toDisplayName || "Colaborador",
      photoURL: inv.toPhotoURL ?? undefined,
      professionalType: inv.toProfessionalType ?? undefined,
    }));

    const asInvitee: Collaborator[] = raw.receivedAccepted.map((inv) => ({
      refId: inv.fromUid ?? "",
      kind: "user",
      displayName: inv.fromDisplayName || "Colaborador",
      photoURL: inv.fromPhotoURL ?? undefined,
      professionalType: inv.fromProfessionalType ?? undefined,
    }));

    const externals: Collaborator[] = raw.externals.map((e) => ({
      refId: e.id,
      kind: "external",
      displayName: e.displayName || "Externo",
      photoURL: e.photoURL ?? undefined,
    }));

    const byId = new Map<string, Collaborator>();
    [...asInviter, ...asInvitee, ...externals].forEach((c) => {
      if (c.refId && !byId.has(c.refId)) byId.set(c.refId, c);
    });
    return [...byId.values()];
  }

  toExternalProfile(dto: FirebaseExternalProfileDto): ExternalProfile {
    return {
      id: dto.id,
      displayName: dto.displayName ?? "Externo",
      photoURL: dto.photoURL ?? undefined,
      bio: dto.bio ?? undefined,
      type: dto.type ?? "person",
      managedBy: dto.managedBy ?? "",
      email: dto.email ?? null,
      socialLinks: dto.socialLinks,
      linkedUserId: null,
      createdAt: this.toDateOrNull(dto.createdAt) ?? new Date(0),
    };
  }

  private toDateOrNull(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (value && typeof value === "object") {
      if (
        "toDate" in value &&
        typeof (value as { toDate: unknown }).toDate === "function"
      ) {
        return (value as { toDate: () => Date }).toDate();
      }
      if ("_seconds" in value) {
        const { _seconds, _nanoseconds } = value as {
          _seconds: number;
          _nanoseconds?: number;
        };
        return new Date(_seconds * 1000 + Math.floor((_nanoseconds ?? 0) / 1e6));
      }
    }
    return null;
  }
}
