import { Timestamp } from "firebase-admin/firestore";
import type {
  EventRegistration,
  EventRegistrationsResult,
  RegistrationType,
} from "@/domain/entities/studio/Studio";

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
}
