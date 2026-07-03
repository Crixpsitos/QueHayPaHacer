import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";

export interface IProfessionalRequestRepository {
  create(request: Omit<ProfessionalRequest, "id">): Promise<ProfessionalRequest>;
  findById(id: string): Promise<ProfessionalRequest | null>;
  findLatestByUid(uid: string): Promise<ProfessionalRequest | null>;
}
