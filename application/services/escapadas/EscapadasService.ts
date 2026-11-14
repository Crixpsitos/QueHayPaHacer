import type { Escapada } from "@/domain/entities/escapadas/Escapada";
import type { EscapadasFirebaseRepository } from "@/infraestructure/firebase/repositories/escapadas/EscapadasFirebaseRepository";

export class EscapadasService {
  constructor(private readonly repository: Pick<EscapadasFirebaseRepository, "findActive">) {}

  listActive(): Promise<Escapada[]> {
    return this.repository.findActive();
  }
}
