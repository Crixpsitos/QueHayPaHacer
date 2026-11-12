import { createHash } from "node:crypto"
import type { Firestore } from "firebase-admin/firestore"
import type { IPushTokenRepository } from "@/domain/repository/push/IPushTokenRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const id = (token: string) => createHash("sha256").update(token).digest("hex").slice(0, 40)

/** `users/{uid}/pushTokens/{hash}`: un doc por dispositivo (privado: solo Admin SDK). */
export class PushTokenFirebaseRepository extends FirebaseBaseRepository implements IPushTokenRepository {
  protected readonly collectionName = "users"
  constructor(db: Firestore) { super(db) }
  private col(uid: string) { return this.collection.doc(uid).collection("pushTokens") }
  async add(uid: string, token: string, now: Date) { await this.col(uid).doc(id(token)).set({ token, createdAt: now }) }
  async remove(uid: string, token: string) { await this.col(uid).doc(id(token)).delete() }
  async list(uid: string) { return (await this.col(uid).limit(20).get()).docs.map((d) => d.get("token") as string) }
}
