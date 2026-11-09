import { FieldPath, type Firestore } from "firebase-admin/firestore"
import { sumStats, type DailyStatsDoc, type StatsTotals } from "@/domain/entities/analytics/fichaStats"

const ID = /^[A-Za-z0-9_-]{1,128}$/

/** Lee los docs diarios `events|sites/{id}/stats/{día}` (ids = día `YYYY-MM-DD`) y los suma. Solo lectura. */
export class DailyStatsFirebaseRepository {
  constructor(private readonly db: Firestore) {}

  async sumSince(collection: "events" | "sites", id: string, sinceDay: string): Promise<StatsTotals> {
    if ((collection !== "events" && collection !== "sites") || !ID.test(id)) throw new Error("Consulta de estadísticas inválida.")
    const snap = await this.db.collection(collection).doc(id).collection("stats").where(FieldPath.documentId(), ">=", sinceDay).get()
    return sumStats(snap.docs.map((d) => d.data() as DailyStatsDoc))
  }
}
