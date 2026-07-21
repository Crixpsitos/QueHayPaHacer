import type { IProfessionalRequestRepository } from "@/domain/repository/professional/IProfessionalRequestRepository";
import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";
import type { IProfessionalRequestFirebaseRepository } from "@/infraestructure/firebase/repositories/professional/IProfessionalRequestFirebaseRepository";
import type { ProfessionalRequestFirebaseMapper } from "@/infraestructure/firebase/mappers/professional/ProfessionalRequestFirebaseMapper";

/** Puerto de dominio: envuelve el repo Firebase y mapea DTO → dominio. */
export class ProfessionalRequestAdapter implements IProfessionalRequestRepository {
  constructor(
    private readonly repository: IProfessionalRequestFirebaseRepository,
    private readonly mapper: ProfessionalRequestFirebaseMapper,
  ) {}

  async create(request: Omit<ProfessionalRequest, "id">): Promise<ProfessionalRequest> {
    const dto = await this.repository.create(request);
    return this.mapper.toDomain(dto);
  }

  async findById(id: string): Promise<ProfessionalRequest | null> {
    const dto = await this.repository.findById(id);
    return dto ? this.mapper.toDomain(dto) : null;
  }

  async findLatestByUid(uid: string): Promise<ProfessionalRequest | null> {
    const dto = await this.repository.findLatestByUid(uid);
    return dto ? this.mapper.toDomain(dto) : null;
  }
}
