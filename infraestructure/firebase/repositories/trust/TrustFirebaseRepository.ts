import type { Firestore, Timestamp } from "firebase-admin/firestore"
import type { ITrustRepository } from "@/domain/repository/trust/ITrustRepository"
import type { TrustOverride, TrustSignals } from "@/domain/entities/trust/trust"

const toMs = (v: unknown) => (typeof v === "number" ? v : (v as Timestamp | undefined)?.toMillis?.() ?? 0)

/**
 * Señales para la confianza de una cuenta. Solo lecturas: cuenta con `count()` (1 lectura por cada 1.000 entradas) lo aprobado
 * en cada colección y mira los pocos rechazados en memoria, sin índices compuestos (solo igualdades).
 * Campo de autoría: eventos y sitios `author.id`; actividades `ownerUid`.
 */
export class TrustFirebaseRepository implements ITrustRepository {
  constructor(private readonly db: Firestore) {}

  async signals(uid: string, since: Date): Promise<TrustSignals> {
    const mine = [["events", "author.id"], ["sites", "author.id"], ["activities", "ownerUid"]] as const
    const [user, account, approved, rejected] = await Promise.all([
      this.db.collection("users").doc(uid).get(),
      this.db.collection("activityAccounts").doc(uid).get(),
      Promise.all(mine.map(async ([col, field]) => (await this.db.collection(col).where(field, "==", uid).where("moderationStatus", "==", "approved").count().get()).data().count)),
      Promise.all(mine.map(async ([col, field]) => (await this.db.collection(col).where(field, "==", uid).where("moderationStatus", "==", "rejected").select("reviewedAt", "rejectedAt").limit(20).get()).docs)),
    ])
    const level = (user.get("trust.level") as string | undefined) ?? undefined
    const override: TrustOverride | undefined = level === "trusted" || level === "restricted" ? level : undefined
    const sinceMs = since.getTime()
    const rejectedRecent = rejected.flat().filter((d) => Math.max(toMs(d.get("reviewedAt")), toMs(d.get("rejectedAt"))) >= sinceMs).length
    return {
      override,
      creatorVerified: user.get("creatorVerified") === true,
      approvedCount: approved.reduce((a, b) => a + b, 0),
      rejectedRecent,
      suspended: toMs(account.get("suspendedUntil")) > Date.now(),
    }
  }
}
