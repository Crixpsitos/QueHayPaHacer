import type { ActivityReview } from "@/domain/entities/activities/review/ActivityReview"
import type { IActivityAppealRepository } from "@/domain/repository/activities/IActivityAppealRepository"

export const APPEAL_MIN_CHARS = 30
export const APPEAL_MAX_CHARS = 1000

export interface AppealDeps {
  appeals: IActivityAppealRepository
  getReview: (reviewId: string) => Promise<ActivityReview | null>
  /** Restituye la reseña (vuelve publicada y al promedio). */
  restore: (reviewId: string) => Promise<boolean>
  clock: () => Date
}

/** Apelar una reseña retirada: una sola vez. QHPA decide (restituir o cerrar sin trámite). */
export class ActivityAppealService {
  constructor(private readonly d: AppealDeps) {}

  async submit(uid: string, reviewId: string, explanation: string): Promise<void> {
    const text = explanation.trim()
    if (text.length < APPEAL_MIN_CHARS) throw new Error(`Explica por qué crees que fue un error (mínimo ${APPEAL_MIN_CHARS} caracteres).`)
    if (text.length > APPEAL_MAX_CHARS) throw new Error(`La explicación admite máximo ${APPEAL_MAX_CHARS} caracteres.`)
    const review = await this.d.getReview(reviewId)
    if (!review || review.uid !== uid) throw new Error("Esa reseña no es tuya.")
    if (review.status !== "removed") throw new Error("Solo se apela una reseña retirada.")
    const created = await this.d.appeals.create({ reviewId, uid, explanation: text, status: "open", createdAt: this.d.clock() })
    if (!created) throw new Error("Ya apelaste esta reseña: solo se puede una sola vez.")
  }

  async resolve(reviewId: string, decision: "restored" | "rejected", by: string): Promise<void> {
    const a = await this.d.appeals.get(reviewId)
    if (!a || a.status !== "open") throw new Error("No hay una apelación abierta para esa reseña.")
    if (decision === "restored" && !(await this.d.restore(reviewId))) throw new Error("No se pudo restituir la reseña.")
    await this.d.appeals.resolve(reviewId, decision, by, this.d.clock())
  }
}
