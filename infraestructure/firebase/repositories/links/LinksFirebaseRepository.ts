import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"
import type { LinkDoc, LinksRepo } from "@/application/services/links/LinksService"

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
}
