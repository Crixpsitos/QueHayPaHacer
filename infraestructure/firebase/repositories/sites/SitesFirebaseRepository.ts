import { FieldPath, FieldValue, type Firestore } from "firebase-admin/firestore"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"
import type { ISitesFirebaseRepository, PaginatedSiteIds } from "./ISitesFirebaseRepository"
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

  /** Base del discovery público: published + approved + activo. */
  private get publishedSites() {
    return this.collection
      .where("publicationStatus", "==", "published")
      .where("moderationStatus", "==", "approved")
      .where("isActive", "==", true)
  }

  async findFeaturedSiteIds(): Promise<string[]> {
    const snap = await this.publishedSites
      .where("analytics.score", ">=", 20)
      .orderBy("analytics.score", "desc")
      .limit(10)
      .select()
      .get()
    return snap.docs.map((d) => d.id)
  }

  async findAllSiteIds(): Promise<string[]> {
    const snap = await this.publishedSites
      .orderBy("analytics.score", "desc")
      .limit(30)
      .select()
      .get()
    return snap.docs.map((d) => d.id)
  }

  async findSiteIdsByCategory(
    category: string,
    limit: number,
    cursor: string | null,
  ): Promise<PaginatedSiteIds> {
    let query = this.publishedSites
      .where("category", "==", category)
      .orderBy("analytics.score", "desc")
      // Tiebreaker documentId → cursor estable sin índice extra (score con ties).
      .orderBy(FieldPath.documentId(), "desc")

    if (cursor) {
      const sep = cursor.indexOf("|")
      query = query.startAfter(Number(cursor.slice(0, sep)), cursor.slice(sep + 1))
    }

    const snap = await query.limit(limit + 1).select("analytics.score").get()
    const docs = snap.docs
    const hasMore = docs.length > limit
    const page = docs.slice(0, limit)
    const last = page[page.length - 1]
    const nextCursor =
      hasMore && last
        ? `${(last.data() as { analytics?: { score?: number } }).analytics?.score ?? 0}|${last.id}`
        : null

    return { ids: page.map((d) => d.id), nextCursor }
  }

  async findBySlug(slug: string): Promise<FirebaseSiteDto | null> {
    const snap = await this.collection
      .where("slug", "==", slug)
      .limit(1)
      .get()
    if (snap.empty) return null
    const doc = snap.docs[0]
    return { id: doc.id, ...doc.data() } as FirebaseSiteDto
  }
}
