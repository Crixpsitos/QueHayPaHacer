import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore"
import type { GuestEntry, IEventGuestRepository } from "@/domain/repository/EventRegistration/IEventGuestRepository"

export class EventGuestFirebaseRepository implements IEventGuestRepository {
  constructor(private readonly db: Firestore) {}
  private regs(eventId: string) { return this.db.collection("events").doc(eventId).collection("registrations") }

  async count(eventId: string): Promise<number> {
    return (await this.regs(eventId).where("guest", "==", true).count().get()).data().count
  }

  async add(eventId: string, g: GuestEntry): Promise<void> {
    const batch = this.db.batch()
    batch.set(this.regs(eventId).doc(g.id), {
      userId: g.id, eventId, parentType: "events", name: g.name, email: "", registeredAt: Timestamp.now(),
      registrationType: "internal", status: "registered", checkInCode: g.code, guest: true, addedBy: g.addedBy, ...(g.phone ? { phone: g.phone } : {}), ...(g.tier ? { tier: g.tier } : {}),
    })
    batch.set(this.db.collection("events").doc(eventId), { analytics: { registrations: FieldValue.increment(1) }, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    await batch.commit()
  }

  async findByCode(eventId: string, code: string): Promise<{ name: string } | null> {
    const s = await this.regs(eventId).where("checkInCode", "==", code).where("guest", "==", true).limit(1).get()
    if (s.empty) return null
    const d = s.docs[0]
    return d.get("status") === "canceled" ? null : { name: String(d.get("name") ?? "") }
  }
}
