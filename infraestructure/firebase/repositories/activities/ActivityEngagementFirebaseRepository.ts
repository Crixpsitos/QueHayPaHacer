import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { buildTrackWrites } from "@/domain/entities/analytics/trackWrites"
import type { ActivityTrackType } from "@/domain/entities/analytics/trackTypes"
import type { TrafficSource } from "@/domain/entities/analytics/trafficSource"
import type { IActivityEngagementRepository } from "@/domain/repository/activities/IActivityEngagementRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

/**
 * Guardados (`users/{uid}/saved/activity_{id}`, privados) y visitas (`activities/{id}/visits/{uid}`).
 * Cada cambio y su contador agregado van en UNA transacción: doble toque o dos pestañas = un solo cambio.
 */
export class ActivityEngagementFirebaseRepository extends FirebaseBaseRepository implements IActivityEngagementRepository {
  protected readonly collectionName = "activities"

  constructor(db: Firestore) {
    super(db)
  }

  private savedRef(uid: string, activityId: string) {
    return this.db.collection("users").doc(uid).collection("saved").doc(`activity_${activityId}`)
  }

  async setSaved(uid: string, activityId: string, saved: boolean): Promise<{ changed: boolean }> {
    const ref = this.savedRef(uid, activityId)
    const activity = this.collection.doc(activityId)
    return this.db.runTransaction(async (tx) => {
      const [mine, act] = await Promise.all([tx.get(ref), tx.get(activity)])
      const exists = mine.exists
      if (exists === saved) return { changed: false }
      if (!act.exists && saved) return { changed: false } // actividad borrada: no se guarda; sí se puede quitar
      if (saved) {
        tx.set(ref, { type: "activity", targetId: activityId, savedAt: FieldValue.serverTimestamp() })
        tx.set(activity.collection("savers").doc(uid), { savedAt: FieldValue.serverTimestamp() }) // quién guardó: solo para avisar (uid, sin más datos)
        tx.update(activity, { "analytics.saves": FieldValue.increment(1) })
      } else {
        tx.delete(ref)
        tx.delete(activity.collection("savers").doc(uid))
        if (act.exists) tx.update(activity, { "analytics.saves": FieldValue.increment(-1) })
      }
      return { changed: true }
    })
  }

  async savedAmong(uid: string, activityIds: string[]): Promise<string[]> {
    const refs = activityIds.slice(0, 100).map((id) => this.savedRef(uid, id))
    const snaps = await this.db.getAll(...refs)
    return snaps.filter((s) => s.exists).map((s) => String(s.get("targetId")))
  }

  async listSavedIds(uid: string, limit: number): Promise<string[]> {
    // ponytail: sin filtro por tipo en la consulta (pediría índice compuesto); lo guardado de otros tipos se descarta aquí.
    const s = await this.db.collection("users").doc(uid).collection("saved").orderBy("savedAt", "desc").limit(limit * 3).get()
    return s.docs.filter((d) => d.get("type") === "activity").map((d) => String(d.get("targetId"))).slice(0, limit)
  }

  async listSaverIds(activityId: string, limit: number): Promise<string[]> {
    const s = await this.collection.doc(activityId).collection("savers").limit(limit).get()
    return s.docs.map((d) => d.id)
  }

  async listVisitedIds(uid: string, limit: number): Promise<string[]> {
    const s = await this.db.collection("users").doc(uid).collection("activityVisits").orderBy("visitedAt", "desc").limit(limit).get()
    return s.docs.map((d) => d.id)
  }

  async markVisited(uid: string, activityId: string): Promise<{ changed: boolean }> {
    const activity = this.collection.doc(activityId)
    const ref = activity.collection("visits").doc(uid)
    return this.db.runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) return { changed: false }
      tx.set(ref, { visitedAt: FieldValue.serverTimestamp() })
      tx.set(this.db.collection("users").doc(uid).collection("activityVisits").doc(activityId), { visitedAt: FieldValue.serverTimestamp() }) // para "Mis planes"
      tx.update(activity, { "analytics.visits": FieldValue.increment(1) })
      return { changed: true }
    })
  }

  /** Conteo de vista/acción (misma forma que eventos): `analytics.views|clicks` + doc diario con origen. */
  async recordTrack(activityId: string, type: ActivityTrackType, day: string, source: TrafficSource): Promise<void> {
    const ref = this.collection.doc(activityId)
    const w = buildTrackWrites(type, day, source, (n) => FieldValue.increment(n))
    const batch = this.db.batch()
    // update() (no set): no crea actividades inventadas; NOT_FOUND se ignora (el batch es atómico).
    batch.update(ref, w.event)
    batch.set(ref.collection("stats").doc(day), w.stats, { merge: true })
    try {
      await batch.commit()
    } catch (e) {
      if ((e as { code?: number }).code === 5) return
      throw e
    }
  }

  async hasVisited(uid: string, activityId: string): Promise<boolean> {
    return (await this.collection.doc(activityId).collection("visits").doc(uid).get()).exists
  }
}
