import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { joinDocId, type JoinDecision } from "@/domain/entities/activities/activityJoin"
import type { IActivityJoinRepository, JoinOutcome, JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: () => Date }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : new Date(0))

/**
 * `activityJoins/{actividad}_{salida}_{uid}` (una por persona y salida; solo Admin SDK) y el contador
 * `activities/{id}/joinCounts/{salida}`. Inscribir y contar van en una transacción: el último cupo no se vende dos veces.
 */
export class ActivityJoinFirebaseRepository extends FirebaseBaseRepository implements IActivityJoinRepository {
  protected readonly collectionName = "activityJoins"

  constructor(db: Firestore) {
    super(db)
  }

  private counter(activityId: string, key: string) {
    return this.db.collection("activities").doc(activityId).collection("joinCounts").doc(key)
  }

  async join(i: { activityId: string; key: string; uid: string; name: string }, decide: (taken: number) => JoinDecision): Promise<JoinOutcome> {
    const ref = this.collection.doc(joinDocId(i.activityId, i.key, i.uid))
    const counter = this.counter(i.activityId, i.key)
    return this.db.runTransaction(async (tx) => {
      const [mine, c] = await Promise.all([tx.get(ref), tx.get(counter)])
      if (mine.exists) return "already" as const
      const d = decide(Number(c.get("taken") ?? 0))
      if (!d.ok) return d.reason
      tx.set(ref, { activityId: i.activityId, key: i.key, uid: i.uid, name: i.name.slice(0, 80), createdAt: FieldValue.serverTimestamp() })
      tx.set(counter, { taken: FieldValue.increment(1) }, { merge: true })
      return "joined" as const
    })
  }

  async cancel(i: { activityId: string; key: string; uid: string }): Promise<{ changed: boolean }> {
    const ref = this.collection.doc(joinDocId(i.activityId, i.key, i.uid))
    const counter = this.counter(i.activityId, i.key)
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists || snap.get("activityId") !== i.activityId || snap.get("key") !== i.key) return { changed: false }
      tx.delete(ref)
      tx.set(counter, { taken: FieldValue.increment(-1) }, { merge: true })
      return { changed: true }
    })
  }

  async setClosed(activityId: string, closed: boolean): Promise<boolean> {
    const ref = this.db.collection("activities").doc(activityId)
    return this.db.runTransaction(async (tx) => {
      const s = await tx.get(ref)
      if (!s.exists || !s.get("join")) return false
      tx.update(ref, { "join.closed": closed }) // solo el campo: no pisa contadores ni moderación
      return true
    })
  }

  async counts(activityId: string, keys: string[]): Promise<Record<string, number>> {
    if (!keys.length) return {}
    const snaps = await this.db.getAll(...keys.map((k) => this.counter(activityId, k)))
    return Object.fromEntries(snaps.map((s, n) => [keys[n], Math.max(0, Number(s.get("taken") ?? 0))]))
  }

  async mine(activityId: string, uid: string, keys: string[]): Promise<string[]> {
    if (!keys.length) return []
    const snaps = await this.db.getAll(...keys.map((k) => this.collection.doc(joinDocId(activityId, k, uid))))
    return keys.filter((_, n) => snaps[n].exists)
  }

  async list(activityId: string, limit: number): Promise<JoinRow[]> {
    // ponytail: una sola igualdad (sin índice compuesto); el volumen por actividad es pequeño y se ordena en memoria.
    const s = await this.collection.where("activityId", "==", activityId).limit(limit).get()
    return s.docs
      .map((d) => ({ uid: String(d.get("uid")), name: String(d.get("name") ?? ""), key: String(d.get("key")), createdAt: toDate(d.get("createdAt")) }))
      .sort((a, b) => a.key.localeCompare(b.key) || a.createdAt.getTime() - b.createdAt.getTime())
  }
}
