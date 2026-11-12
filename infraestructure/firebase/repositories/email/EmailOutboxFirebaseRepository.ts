import type { DocumentData, Firestore } from "firebase-admin/firestore"
import type { IEmailOutboxRepository, OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const ALREADY_EXISTS = 6
const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : v instanceof Date ? v : new Date(0))
const from = (id: string, d: DocumentData): OutboxItem => ({ id, uid: d.uid, to: d.to, kind: d.kind, subject: d.subject, text: d.text, html: d.html, headers: d.headers, status: d.status, attempts: d.attempts ?? 0, sendAfter: toDate(d.sendAfter), createdAt: toDate(d.createdAt), sentAt: d.sentAt ? toDate(d.sentAt) : undefined, providerId: d.providerId, lastError: d.lastError })

/** `emailOutbox/{id}`: cola (solo Admin SDK). Sin índice compuesto: se filtra por estado y el orden se hace en memoria. */
export class EmailOutboxFirebaseRepository extends FirebaseBaseRepository implements IEmailOutboxRepository {
  protected readonly collectionName = "emailOutbox"
  constructor(db: Firestore) { super(db) }

  async enqueue(item: OutboxItem): Promise<boolean> {
    const { id, ...rest } = item
    try { await this.collection.doc(id).create({ ...rest, headers: rest.headers ?? null, expireAt: new Date(item.createdAt.getTime() + 90 * 86_400_000) }); return true } catch (e) { if ((e as { code?: number }).code === ALREADY_EXISTS) return false; throw e }
  }
  async due(now: Date, limit: number): Promise<OutboxItem[]> {
    const s = await this.collection.where("status", "==", "queued").limit(1000).get()
    return s.docs.map((d) => from(d.id, d.data())).filter((i) => i.sendAfter <= now).slice(0, limit)
  }
  async markSent(id: string, providerId: string, at: Date): Promise<void> { await this.collection.doc(id).update({ status: "sent", providerId, sentAt: at, text: "", html: "" }) } // el cuerpo no se conserva tras enviar
  async markRetry(id: string, attempts: number, sendAfter: Date | null, error: string): Promise<void> {
    await this.collection.doc(id).update(sendAfter ? { attempts, sendAfter, lastError: error.slice(0, 200) } : { attempts, status: "failed", lastError: error.slice(0, 200), text: "", html: "" })
  }
}
