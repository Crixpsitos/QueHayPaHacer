import type { ITrustRepository } from "@/domain/repository/trust/ITrustRepository"
import { TRUST_WINDOW_DAYS, computeTrust, type TrustResult } from "@/domain/entities/trust/trust"

/** Decide si una cuenta publica con moderación posterior (ver domain/entities/trust). Solo lecturas. */
export class TrustService {
  constructor(private readonly repo: ITrustRepository, private readonly clock: () => Date = () => new Date()) {}

  async evaluate(uid: string): Promise<TrustResult> {
    const now = this.clock()
    const since = new Date(now.getTime() - TRUST_WINDOW_DAYS * 86_400_000)
    try {
      return computeTrust(await this.repo.signals(uid, since))
    } catch (error) {
      // Ante cualquier fallo de lectura se cae al camino seguro: moderación previa.
      console.error("[trust] no se pudo evaluar la confianza", error)
      return { trusted: false, restricted: false, reason: "none" }
    }
  }
}
