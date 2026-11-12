import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";
import type { CancelBlock, UserRegistrationItem } from "@/domain/entities/EventRegistration/myRegistrations";

export type { UserRegistrationItem };
export type CancelRegistrationResult = "ok" | "not_found" | CancelBlock;

export type CheckInCodeResult =
  | { status: "ok"; code: string; title: string }
  | { status: "not_found" | "canceled" | "finished" | "no_attendance" };

/** Resultado de «Me interesa» en un evento con enlace externo. `already`: ya estaba vigente, no se cambió nada. */
export interface ExternalInterestResult { outcome: "interested" | "waitlist"; position: number | null; already: boolean }

export interface RegisterEventInput {
  userId: string;
  eventId: string;
  /** Registro a una sesión concreta (multi-date). */
  sessionId?: string;
  name: string;
  email: string;
  registrationType: "internal" | "form";
  formData?: Record<string, string | string[] | number | boolean | null | Record<string, unknown>>;
}

export interface IEventRegistrationRepository {
  findByEventIdAndUserId(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<EventRegistration | null>;

  isUserRegistered(eventId: string, userId: string, sessionId?: string): Promise<boolean>;

  registerUserToEvent(input: RegisterEventInput): Promise<void>;

  /** «Me interesa» con cupos (24 h de vigencia y lista de espera). Ver `domain/entities/EventRegistration/interest.ts`. */
  registerExternalInterest(input: RegisterEventInput): Promise<ExternalInterestResult>;

  /** Inscripciones del usuario en todos los eventos/sesiones (las 100 más recientes). */
  listByUserId(userId: string, limit?: number): Promise<UserRegistrationItem[]>;

  /** Código de check-in de la inscripción propia; lo crea si no existe. */
  getOrCreateCheckInCode(eventId: string, userId: string, sessionId?: string): Promise<CheckInCodeResult>;

  /** Marca la inscripción como cancelada y baja el contador. Solo el dueño (doc id = uid). */
  cancelRegistration(eventId: string, userId: string, sessionId?: string): Promise<CancelRegistrationResult>;
}
