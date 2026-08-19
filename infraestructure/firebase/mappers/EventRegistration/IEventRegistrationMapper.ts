import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";
import type { FirebaseEventRegistration } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistration";

export interface IEventRegistrationMapper {
  toDomain(dto: FirebaseEventRegistration): EventRegistration;
  toDto(domain: EventRegistration): FirebaseEventRegistration;
}
