import type { ProfessionalRequest } from "@/domain/entities/professional/ProfessionalRequest";
import type { FirebaseProfessionalRequestDto } from "@/infraestructure/firebase/dto/professional/FirebaseProfessionalRequestDto";

/**
 * Puerto de infraestructura: devuelve DTOs crudos de Firestore. El mapeo
 * DTO → dominio vive en `ProfessionalRequestAdapter`.
 */
export interface IProfessionalRequestFirebaseRepository {
  create(request: Omit<ProfessionalRequest, "id">): Promise<FirebaseProfessionalRequestDto>;
  findById(id: string): Promise<FirebaseProfessionalRequestDto | null>;
  findLatestByUid(uid: string): Promise<FirebaseProfessionalRequestDto | null>;
}
