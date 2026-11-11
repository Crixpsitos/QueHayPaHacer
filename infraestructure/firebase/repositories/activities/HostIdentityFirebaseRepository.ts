import type { Firestore } from "firebase-admin/firestore"
import type { HostIdentityRecord } from "@/domain/entities/activities/HostIdentity"
import type { HostIdentityAccess, IHostIdentityRepository } from "@/domain/repository/activities/IHostIdentityRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

type DateLike = Date | { toDate(): Date }
const toDate = (v: DateLike) => (v instanceof Date ? v : v.toDate())

/** `hostIdentities/{uid}`: datos personales del oferente. Solo Admin SDK; nunca se lee desde el cliente. */
export class HostIdentityFirebaseRepository extends FirebaseBaseRepository implements IHostIdentityRepository {
  protected readonly collectionName = "hostIdentities"

  constructor(db: Firestore) {
    super(db)
  }

  async get(uid: string): Promise<HostIdentityRecord | null> {
    const d = await this.collection.doc(uid).get()
    if (!d.exists) return null
    const x = d.data() as Omit<HostIdentityRecord, "confirmedAt" | "updatedAt"> & { confirmedAt: DateLike; updatedAt: DateLike }
    return { ...x, uid: d.id, confirmedAt: toDate(x.confirmedAt), updatedAt: toDate(x.updatedAt) }
  }

  async upsert(record: HostIdentityRecord): Promise<void> {
    const { uid, ...data } = record
    // Firestore rechaza `undefined` (p. ej. `representative` en una persona): se quita antes de guardar.
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
    await this.collection.doc(uid).set(clean)
  }

  async appendAccess(hostUid: string, entry: HostIdentityAccess): Promise<void> {
    await this.subCollection(hostUid, "accessLog").add(Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined)))
  }
}
