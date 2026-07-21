import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";
import type { FirebaseProfessionalRequestDto } from "@/infraestructure/firebase/dto/professional/FirebaseProfessionalRequestDto";

/** Documento crudo de Firestore → entidad de dominio `ProfessionalRequest`. */
export class ProfessionalRequestFirebaseMapper {
  toDomain(dto: FirebaseProfessionalRequestDto): ProfessionalRequest {
    return {
      id: dto.id,
      uid: dto.uid,
      status: dto.status,
      submittedAt: this.toDate(dto.submittedAt),
      reviewedAt: dto.reviewedAt ? this.toDate(dto.reviewedAt) : null,
      rejectionReason: dto.rejectionReason ?? null,
      professionalType: dto.professionalType,
      brandName: dto.brandName,
      description: dto.description,
      phone: dto.phone,
      website: dto.website ?? null,
      previousRequestId: dto.previousRequestId ?? null,
      reapplyReason: dto.reapplyReason ?? null,
      details: dto.details,
    };
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === "object" && value !== null && "toDate" in value) {
      return (value as { toDate: () => Date }).toDate();
    }
    return new Date();
  }
}
