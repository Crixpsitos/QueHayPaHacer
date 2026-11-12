import type { DocumentData, Firestore } from "firebase-admin/firestore"
import type { NotificationPrefs } from "@/domain/entities/notificationPrefs/prefs"
import { defaultPrefs } from "@/domain/entities/notificationPrefs/prefs"
import type { INotificationPrefsRepository } from "@/domain/repository/notificationPrefs/INotificationPrefsRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : v instanceof Date ? v : new Date(0))
const from = (d: DocumentData): NotificationPrefs => {
  const base = defaultPrefs()
  return {
    email: { ...base.email, ...(d.email ?? {}) }, push: { ...base.push, ...(d.push ?? {}) },
    consent: d.consent ? { at: toDate(d.consent.at), version: String(d.consent.version ?? "") } : null,
    unsubscribedAt: d.unsubscribedAt ? toDate(d.unsubscribedAt) : null,
  }
}

/** `users/{uid}/notificationPrefs/main` (privado). «Quién aceptó» vive en `notificationOptIns/{uid}` (colección de primer nivel: la consulta por un campo no necesita índice). */
export class NotificationPrefsFirebaseRepository extends FirebaseBaseRepository implements INotificationPrefsRepository {
  protected readonly collectionName = "users"
  constructor(db: Firestore) { super(db) }
  private ref(uid: string) { return this.collection.doc(uid).collection("notificationPrefs").doc("main") }

  async get(uid: string): Promise<NotificationPrefs | null> { const s = await this.ref(uid).get(); return s.exists ? from(s.data()!) : null }
  async set(uid: string, p: NotificationPrefs): Promise<void> {
    await this.ref(uid).set({ ...p, uid })
    const live = p.consent !== null && p.unsubscribedAt === null
    await this.db.collection("notificationOptIns").doc(uid).set({ forYou: live && p.email.forYou, weekly: live && p.email.weekly, updatedAt: new Date() })
  }
  async uidsWith(kind: "forYou" | "weekly", limit: number): Promise<string[]> {
    const s = await this.db.collection("notificationOptIns").where(kind, "==", true).limit(limit).get()
    return s.docs.map((d) => d.id)
  }
}
