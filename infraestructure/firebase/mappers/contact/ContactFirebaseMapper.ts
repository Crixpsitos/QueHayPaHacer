import type { Contact } from "@/domain/entities/contact/Contact";
import type { FirebaseContactDto } from "../../dto/contact/FirebaseContactDto";

export class ContactFirebaseMapper {
  toDomain(dto: FirebaseContactDto): Contact {
    return {
      id: dto.id,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      message: dto.message,
      uid: dto.uid,
      createdAt: new Date(),
    };
  }
}
