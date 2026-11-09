import { FieldPath, FieldValue, type Firestore } from "firebase-admin/firestore"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"
import type { LinkDoc, LinkWithClicks, LinksRepo } from "@/application/services/links/LinksService"

/** `links/{código}` = { code, label, target, ownerUid, active, createdAt }; `links/{código}/stats/{día}` = { day, clicks }. */
export class LinksFirebaseRepository extends FirebaseBaseRepository implements LinksRepo {
  protected readonly collectionName = "links"

  constructor(db: Firestore) {
    super(db)
  }

  /** `create()` (no `set`): falla con ALREADY_EXISTS si el código está tomado, así dos enlaces nunca comparten código. */
  async create(link: Omit<LinkDoc, "active">): Promise<void> {
    await this.collection.doc(link.code).create({ ...link, active: true, createdAt: FieldValue.serverTimestamp() })
  }

  async findByCode(code: string): Promise<LinkDoc | null> {
    const snap = await this.collection.doc(code).get()
    if (!snap.exists) return null
    const d = snap.data() as LinkDoc
    return { code: d.code, label: d.label, target: d.target, ownerUid: d.ownerUid, active: d.active === true }
  }

  async recordClick(code: string, day: string): Promise<void> {
    await this.subCollection(code, "stats").doc(day).set({ day, clicks: FieldValue.increment(1) }, { merge: true })
  }

  async countByOwner(ownerUid: string): Promise<number> {
    const snap = await this.collection.where("ownerUid", "==", ownerUid).count().get()
    return snap.data().count
  }

  /** Enlaces del dueño (máx. 50, el tope de creación) con la suma de clics de `stats` desde `sinceDay` (ids = día `YYYY-MM-DD`). Más recientes primero. */
  async listByOwner(ownerUid: string, sinceDay: string): Promise<LinkWithClicks[]> {
    const snap = await this.collection.where("ownerUid", "==", ownerUid).limit(50).get()
    const rows = await Promise.all(
      snap.docs.map(async (doc) => {
        const d = doc.data() as LinkDoc & { createdAt?: { toMillis?: () => number } }
        const stats = await this.subCollection(d.code, "stats").where(FieldPath.documentId(), ">=", sinceDay).get()
        const clicks = stats.docs.reduce((sum, s) => sum + (Number(s.data().clicks) || 0), 0)
        return { code: d.code, label: d.label, target: d.target, ownerUid: d.ownerUid, active: d.active === true, clicks, createdAtMs: d.createdAt?.toMillis?.() ?? 0 }
      }),
    )
    return rows.sort((a, b) => b.createdAtMs - a.createdAtMs).map(({ createdAtMs: _drop, ...link }) => link)
  }
}
