import { Timestamp } from "firebase-admin/firestore";

import type { EventRegistration } from "@/domain/entities/EventRegistration/EventRegistration";
import type { Events } from "@/domain/entities/events/Events";
import type { User } from "@/domain/entities/user/User";
import type { FirebaseEventRegistration } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistration";

import type { IEventRegistrationMapper } from "./IEventRegistrationMapper";
import {
  transformDatesToTimestampsRecursively,
  transformTimestampsToDatesRecursively,
} from "../shared/timestampRecursiveTransform";

export class EventRegistrationFirebaseMapper implements IEventRegistrationMapper {
  toDomain(dto: FirebaseEventRegistration): EventRegistration {
    return {
      id: dto.id,
      eventId: dto.eventId,
      userId: dto.userId,
      status: dto.status,
      event: dto.event as Partial<Events>,
      user: dto.user as Partial<User>,
      registeredAt: dto.registeredAt.toDate(),
      formData: transformTimestampsToDatesRecursively(dto.formData) as
        | Record<
            string,
            | string
            | string[]
            | number
            | boolean
            | null
            | Record<string, unknown>
          >
        | undefined,
      qrCode: dto.qrCode,
      checkedInAt: dto.checkedInAt?.toDate(),
      createdAt: dto.createdAt.toDate(),
      updatedAt: dto.updatedAt.toDate(),
    };
  }

  toDto(domain: EventRegistration): FirebaseEventRegistration {
    return {
      id: domain.id,
      eventId: domain.eventId,
      userId: domain.userId,
      status: domain.status,
      event: domain.event as Partial<
        import("@/infraestructure/firebase/dto/events/FirebaseEventsDto").FirebaseEventsDto
      >,
      user: domain.user as Partial<
        import("@/infraestructure/firebase/dto/FirebaseUserDto").FirebaseUserDto
      >,
      registeredAt: Timestamp.fromDate(domain.registeredAt),
      formData: transformDatesToTimestampsRecursively(domain.formData) as
        | Record<
            string,
            | string
            | string[]
            | number
            | boolean
            | null
            | Record<string, unknown>
          >
        | undefined,
      qrCode: domain.qrCode,
      checkedInAt: domain.checkedInAt
        ? Timestamp.fromDate(domain.checkedInAt)
        : undefined,
      createdAt: Timestamp.fromDate(domain.createdAt),
      updatedAt: Timestamp.fromDate(domain.updatedAt),
    };
  }
}
