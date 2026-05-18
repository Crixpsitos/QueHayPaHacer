import { Events } from "@/domain/entities/events/Events";
import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";

export interface IEventsMapper {
    toDomain(dto: FirebaseEventsDto): Events;
    toDto(firebase: Events): FirebaseEventsDto;
}