import { FieldPath, FieldValue, type Firestore } from "firebase-admin/firestore"
import { isChannel, type Channel } from "@/domain/entities/analytics/trafficSource"
import { sumStats, type DailyStatsDoc, type StatsTotals } from "@/domain/entities/analytics/fichaStats"

const ID = /^[A-Za-z0-9_-]{1,128}$/

/** Docs diarios `events|sites/{id}/stats/{día}` (ids = día `YYYY-MM-DD`): suma de lectura y clic en enlaces automáticos. */
export class DailyStatsFirebaseRepository {
  constructor(private readonly db: Firestore) {}

  /** Docs diarios desde `sinceDay`, cada uno con su día (el id del doc). */
  async readDays(collection: "events" | "sites", id: string, sinceDay: string): Promise<DailyStatsDoc[]> {
    if ((collection !== "events" && collection !== "sites") || !ID.test(id)) throw new Error("Consulta de estadísticas inválida.")
    const snap = await this.db.collection(collection).doc(id).collection("stats").where(FieldPath.documentId(), ">=", sinceDay).get()
    return snap.docs.map((d) => ({ ...(d.data() as DailyStatsDoc), day: d.id }))
  }

  async sumSince(collection: "events" | "sites", id: string, sinceDay: string): Promise<StatsTotals> {
    return sumStats(await this.readDays(collection, id, sinceDay))
  }

  /** Clic en el enlace corto automático de un canal: `linkClicks.<canal>` +1 en el doc del día. No crea la ficha (la ruta ya comprobó que existe). */
  async recordLinkClick(collection: "events" | "sites", id: string, channel: Channel, day: string): Promise<void> {
    if ((collection !== "events" && collection !== "sites") || !ID.test(id) || !isChannel(channel)) throw new Error("Clic de enlace inválido.")
    await this.db.collection(collection).doc(id).collection("stats").doc(day).set({ day, linkClicks: { [channel]: FieldValue.increment(1) } }, { merge: true })
  }
}
