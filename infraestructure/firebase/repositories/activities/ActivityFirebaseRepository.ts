import type { Firestore } from "firebase-admin/firestore"
import type { Activity } from "@/domain/entities/activities/Activity"
import type { IActivityRepository } from "@/domain/repository/activities/IActivityRepository"
import type { FirebaseActivityDto } from "../../dto/activities/FirebaseActivityDto"
import { ActivityFirebaseMapper } from "../../mappers/activities/ActivityFirebaseMapper"
import { mergeMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

/** Colección `activities`. Solo Admin SDK; todas las consultas son de igualdad de un campo (índice simple). */
export class ActivityFirebaseRepository extends FirebaseBaseRepository implements IActivityRepository {
  protected readonly collectionName = "activities"
  private readonly mapper = new ActivityFirebaseMapper()

  constructor(db: Firestore) {
    super(db)
  }

  private toDomain(d: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): Activity {
    return this.mapper.toDomain(d.id, d.data() as FirebaseActivityDto)
  }

  async findById(id: string): Promise<Activity | null> {
    const d = await this.collection.doc(id).get()
    return d.exists ? this.toDomain(d) : null
  }

  async findBySlug(slug: string): Promise<Activity | null> {
    const snap = await this.collection.where("slug", "==", slug).limit(1).get()
    return snap.empty ? null : this.toDomain(snap.docs[0])
  }

  async slugExists(slug: string): Promise<boolean> {
    const snap = await this.collection.where("slug", "==", slug).limit(1).select().get()
    return !snap.empty
  }

  async findByOwner(uid: string): Promise<Activity[]> {
    const snap = await this.collection.where("ownerUid", "==", uid).get()
    return snap.docs.map((d) => this.toDomain(d))
  }

  async findBySite(siteId: string): Promise<Activity[]> {
    const snap = await this.collection.where("siteId", "==", siteId).get()
    return snap.docs.map((d) => this.toDomain(d))
  }

  async findListable(limit: number): Promise<Activity[]> {
    const snap = await this.collection.where("listable", "==", true).limit(limit).get()
    return snap.docs.map((d) => this.toDomain(d))
  }

  async create(activity: Omit<Activity, "id">): Promise<Activity> {
    const ref = this.collection.doc()
    const full = { ...activity, id: ref.id }
    await ref.set(this.mapper.toFirebase(full))
    return full
  }

  async save(activity: Activity): Promise<void> {
    const ref = this.collection.doc(activity.id)
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const stored = snap.exists ? ((snap.data() as FirebaseActivityDto).media ?? []) : []
      tx.set(ref, this.mapper.toFirebase({ ...activity, media: mergeMedia(stored, activity.media) }))
    })
  }
}
