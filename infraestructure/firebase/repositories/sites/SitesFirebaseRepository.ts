import { FieldValue, type Firestore } from "firebase-admin/firestore"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"
import type { ISitesFirebaseRepository } from "./ISitesFirebaseRepository"
import type { FirebaseSiteDto } from "../../dto/sites/FirebaseSiteDto"

export class SitesFirebaseRepository
  extends FirebaseBaseRepository
  implements ISitesFirebaseRepository
{
  protected readonly collectionName = "sites"

  constructor(db: Firestore) {
    super(db)
  }

  async findById(siteId: string): Promise<FirebaseSiteDto | null> {
    const doc = await this.collection.doc(siteId).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() } as FirebaseSiteDto
  }

  async findByAuthorId(authorId: string): Promise<FirebaseSiteDto[]> {
    const snap = await this.collection
      .where("author.id", "==", authorId)
      .orderBy("updatedAt", "desc")
      .get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirebaseSiteDto)
  }

  async create(site: Omit<FirebaseSiteDto, "id" | "createdAt" | "updatedAt">): Promise<FirebaseSiteDto> {
    const ref = this.collection.doc()
    const now = FieldValue.serverTimestamp()
    await ref.set({ ...site, id: ref.id, createdAt: now, updatedAt: now })
    return { ...site, id: ref.id } as FirebaseSiteDto
  }

  async update(site: FirebaseSiteDto): Promise<void> {
    await this.collection.doc(site.id).set(
      { ...site, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
  }

  async delete(siteId: string): Promise<void> {
    await this.collection.doc(siteId).delete()
  }
}
