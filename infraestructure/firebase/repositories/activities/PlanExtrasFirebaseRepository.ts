import { FieldValue, type Firestore } from "firebase-admin/firestore"
import type { IPlanExtrasRepository } from "@/domain/repository/activities/IPlanExtrasRepository"
import { planKey, type PlanItem, type PlanItemKind } from "@/domain/entities/activities/planItem"

/** `users/{uid}/planItems/{event_<id>|site_<id>}`: lo que la persona agregó a su plan (solo Admin SDK). */
export class PlanExtrasFirebaseRepository implements IPlanExtrasRepository {
  constructor(private readonly db: Firestore) {}
  private col(uid: string) { return this.db.collection("users").doc(uid).collection("planItems") }
  private toItem(d: { get: (f: string) => unknown }): PlanItem { return { kind: d.get("kind") as PlanItemKind, refId: d.get("refId") as string, date: (d.get("date") as string | null) ?? null, time: (d.get("time") as string | null) ?? null } }

  async list(uid: string, limit: number): Promise<PlanItem[]> {
    return (await this.col(uid).orderBy("addedAt", "desc").limit(limit).get()).docs.map((d) => this.toItem(d))
  }
  async get(uid: string, kind: PlanItemKind, refId: string): Promise<PlanItem | null> {
    const s = await this.col(uid).doc(planKey(kind, refId)).get()
    return s.exists ? this.toItem(s) : null
  }
  async put(uid: string, item: PlanItem): Promise<void> {
    await this.col(uid).doc(planKey(item.kind, item.refId)).set({ kind: item.kind, refId: item.refId, date: item.date, time: item.time, addedAt: FieldValue.serverTimestamp() })
  }
  async remove(uid: string, kind: PlanItemKind, refId: string): Promise<void> {
    await this.col(uid).doc(planKey(kind, refId)).delete()
  }
}
