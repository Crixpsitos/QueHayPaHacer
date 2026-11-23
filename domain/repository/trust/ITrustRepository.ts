import type { TrustSignals } from "@/domain/entities/trust/trust"

export interface ITrustRepository {
  /** Señales de una cuenta; `since` = inicio de la ventana de rechazos. */
  signals(uid: string, since: Date): Promise<TrustSignals>
}
