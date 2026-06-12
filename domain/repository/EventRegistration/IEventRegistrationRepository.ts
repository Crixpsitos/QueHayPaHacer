import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";

export interface RegisterEventInput {
  userId: string;
  eventId: string;
  name: string;
  email: string;
  registrationType: "internal" | "form";
  formData?: Record<string, string | string[] | number | boolean | null | Record<string, unknown>>;
}

export interface IEventRegistrationRepository {
  findByEventIdAndUserId(
    eventId: string,
    userId: string,
  ): Promise<EventRegistration | null>;

  isUserRegistered(eventId: string, userId: string): Promise<boolean>;

  registerUserToEvent(input: RegisterEventInput): Promise<void>;
}
