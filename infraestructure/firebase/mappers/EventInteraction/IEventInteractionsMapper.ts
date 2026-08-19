import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { FirebaseEventInteractionDto } from "@/infraestructure/firebase/dto/EventInteraction/FirebaseEventInteractionDto";

export interface IEventInteractionsMapper {
  toDomain(dto: FirebaseEventInteractionDto): EventInteractions;
  toDto(domain: EventInteractions): FirebaseEventInteractionDto;
}
