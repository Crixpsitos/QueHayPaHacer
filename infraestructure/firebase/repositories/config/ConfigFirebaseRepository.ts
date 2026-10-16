import { FieldValue, type Firestore, type Timestamp } from "firebase-admin/firestore"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"
import type { ConfigDoc, IConfigRepository } from "@/domain/repository/config/IConfigRepository"

// ponytail: sin adapter/mapper; solo Admin SDK (las reglas niegan todo acceso de cliente).
export class ConfigFirebaseRepository extends FirebaseBaseRepository implements IConfigRepository {
  protected readonly collectionName = "appConfig"

  constructor(db: Firestore) {
    super(db)
  }

  async get<T>(key: string): Promise<ConfigDoc<T> | null> {
    const snap = await this.collection.doc(key).get()
    if (!snap.exists) return null
    const { updatedAt, updatedBy, ...data } = snap.data() as Record<string, unknown>
    return {
      data: data as T,
      updatedAt: (updatedAt as Timestamp | undefined)?.toMillis() ?? 0,
      updatedBy: (updatedBy as string | undefined) ?? null,
    }
  }

  async set<T>(key: string, data: T, updatedBy: string | null): Promise<void> {
    await this.collection.doc(key).set({ ...(data as object), updatedAt: FieldValue.serverTimestamp(), updatedBy })
  }

  async delete(key: string): Promise<void> {
    await this.collection.doc(key).delete()
  }
}
