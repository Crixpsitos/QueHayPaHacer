export interface ActivityAppeal { reviewId: string; uid: string; explanation: string; status: "open" | "restored" | "rejected"; createdAt: Date; resolvedAt?: Date; resolvedBy?: string }

/** `activityAppeals/{reviewId}`: el id del documento garantiza UNA apelación por reseña retirada. */
export interface IActivityAppealRepository {
  /** false si ya existía (una sola vez). */
  create(a: ActivityAppeal): Promise<boolean>
  get(reviewId: string): Promise<ActivityAppeal | null>
  listOpen(limit: number): Promise<ActivityAppeal[]>
  resolve(reviewId: string, status: "restored" | "rejected", by: string, at: Date): Promise<boolean>
}
