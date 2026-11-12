import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";

import { cancelBlock, type UserRegistrationItem } from "@/domain/entities/EventRegistration/myRegistrations";
import { generateCheckInCode } from "@/domain/entities/EventRegistration/checkIn";
import { interestOutcome, seatKind, toPromote, waitlistPosition, type SeatRow } from "@/domain/entities/EventRegistration/interest";
import type { CancelRegistrationResult, CheckInCodeResult, ExternalInterestResult } from "@/domain/repository/EventRegistration/IEventRegistrationRepository";

import type { FirebaseEventRegistration } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistration";
import type { FirebaseEventRegistrationEntry } from "@/infraestructure/firebase/dto/EventRegistration/FirebaseEventRegistrationEntry";

import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import { IEventRegistrationFirebaseRepository } from "./IEventRegistrationFirebaseRepository";

export class EventRegistrationFirebaseRepository
  extends FirebaseBaseRepository
  implements IEventRegistrationFirebaseRepository
{
  protected collectionName: string = "events";

  constructor(db: Firestore) {
    super(db);
  }

  /**
   * Colección de registros. Si `sessionId`, apunta a la subcolección de la
   * sesión: events/{eventId}/sessions/{sessionId}/registrations.
   */
  private registrationsCol(eventId: string, sessionId?: string) {
    if (!sessionId) return this.subCollection(eventId, "registrations");
    return this.subCollection(eventId, "sessions")
      .doc(sessionId)
      .collection("registrations");
  }

  async findByEventIdAndUserId(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<FirebaseEventRegistration | null> {
    const snapshot = await this.registrationsCol(eventId, sessionId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as FirebaseEventRegistration;
  }

  /**
   * Reads the lightweight entry stored at events/{eventId}/registrations/{userId}.
   * O(1) — direct doc lookup, no query.
   */
  async findEntryByEventIdAndUserId(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<FirebaseEventRegistrationEntry | null> {
    const doc = await this.registrationsCol(eventId, sessionId)
      .doc(userId)
      .get();

    if (!doc.exists) return null;
    return doc.data() as FirebaseEventRegistrationEntry;
  }

  /**
   * Writes the registration entry using userId as document ID.
   * Idempotent — calling twice overwrites with the same data.
   * Also increments analytics.registrations on the parent event document.
   */
  async registerUserToEvent(
    eventId: string,
    entry: FirebaseEventRegistrationEntry,
    sessionId?: string,
  ): Promise<void> {
    const batch = this.db.batch();

    const regRef = this.registrationsCol(eventId, sessionId).doc(entry.userId);
    batch.set(regRef, entry, { merge: false });

    // Incrementa el contador en la sesión o en el evento según corresponda.
    const targetRef = sessionId
      ? this.subCollection(eventId, "sessions").doc(sessionId)
      : this.collection.doc(eventId);
    batch.set(
      targetRef,
      {
        analytics: { registrations: FieldValue.increment(1) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
  }

  /**
   * «Me interesa» en un evento con enlace externo, dentro de una transacción. Con capacidad definida: cuenta los cupos (los
   * interesados de más de 24 h ya no cuentan), promueve de la lista de espera a quien le toque por los huecos libres, y deja a
   * esta persona como interesada o en la lista de espera. Sin capacidad no lee las demás inscripciones (cero costo extra).
   * Quien ya estaba interesado y venció vuelve a entrar con un nuevo plazo; quien ya está vigente no cambia.
   */
  async registerExternalInterest(eventId: string, entry: FirebaseEventRegistrationEntry): Promise<ExternalInterestResult> {
    const eventRef = this.collection.doc(eventId);
    const col = this.registrationsCol(eventId);
    const toSeat = (id: string, d: DocumentData): SeatRow & { id: string } => ({
      id,
      status: d.status === "canceled" ? "canceled" : d.status === "accepted" ? "accepted" : "pending",
      registeredAt: (d.registeredAt as Timestamp | undefined)?.toDate() ?? new Date(0),
      checkedInAt: d.checkedInAt,
      paidAmount: typeof d.paidAmount === "number" ? d.paidAmount : null,
      guest: d.guest === true,
      waitlist: d.status === "waitlist",
    });
    return this.db.runTransaction(async (tx) => {
      const regRef = col.doc(entry.userId);
      const [eventSnap, mine] = await Promise.all([tx.get(eventRef), tx.get(regRef)]);
      const capacity = Number(eventSnap.get("capacity")) > 0 ? Number(eventSnap.get("capacity")) : undefined;
      const now = Date.now();
      const mineSeat = mine.exists ? toSeat(mine.id, mine.data()!) : null;
      const mineKind = mineSeat ? seatKind(mineSeat, now) : null;
      if (mineKind === "confirmed" || mineKind === "interested") return { outcome: "interested", position: null, already: true };
      if (mineKind === "waitlist") {
        const all = (await tx.get(col.where("status", "==", "waitlist").limit(2000))).docs.map((d) => toSeat(d.id, d.data()));
        return { outcome: "waitlist", position: waitlistPosition(all, entry.userId, now), already: true };
      }

      let rows: (SeatRow & { id: string })[] = [];
      if (capacity) rows = (await tx.get(col.where("status", "!=", "canceled").limit(2000))).docs.filter((d) => d.id !== entry.userId).map((d) => toSeat(d.id, d.data()));

      const promote = capacity ? toPromote(capacity, rows, now) : [];
      for (const id of promote) tx.update(col.doc(id), { status: "registered", registeredAt: Timestamp.now() });
      rows = rows.map((r) => (promote.includes(r.id) ? { ...r, waitlist: false, registeredAt: now } : r));

      const outcome = capacity ? interestOutcome(capacity, rows, now) : "interested";
      tx.set(regRef, { ...entry, status: outcome === "waitlist" ? "waitlist" : "registered" }, { merge: false });
      const newSeats = promote.length + (outcome === "interested" && mineKind !== "expired" ? 1 : 0);
      if (newSeats > 0) tx.set(eventRef, { analytics: { registrations: FieldValue.increment(newSeats) }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      const position = outcome === "waitlist" ? waitlistPosition([...rows, { id: entry.userId, status: "pending", registeredAt: now, waitlist: true }], entry.userId, now) : null;
      return { outcome, position, already: false };
    });
  }

  /**
   * Inscripciones del usuario en todos los eventos: collectionGroup sobre
   * `registrations` (event-level y session-level) + UNA lectura por lotes
   * (`getAll`) de los eventos y sesiones únicos. Sin N+1. En Enterprise no
   * requiere índice compuesto (verificado en develop).
   * Eventos/sesiones borrados se omiten.
   */
  async listByUserId(userId: string, limit = 100): Promise<UserRegistrationItem[]> {
    const snap = await this.db
      .collectionGroup("registrations")
      .where("userId", "==", userId)
      .orderBy("registeredAt", "desc")
      .limit(limit)
      .get();

    // Ruta: events/{eventId}/registrations/{uid} | events/{eventId}/sessions/{sid}/registrations/{uid}
    // (se deriva de la ruta: las entradas antiguas no siempre traen eventId/sessionId).
    const rows = snap.docs.map((d) => {
      const parts = d.ref.path.split("/");
      return { eventId: parts[1], sessionId: parts.length === 6 ? parts[3] : undefined, data: d.data() };
    });
    if (rows.length === 0) return [];

    const eventRefs = [...new Set(rows.map((r) => r.eventId))].map((id) => this.collection.doc(id));
    const sessionKeys = [...new Set(rows.filter((r) => r.sessionId).map((r) => `${r.eventId}/${r.sessionId}`))];
    const sessionRefs = sessionKeys.map((k) => {
      const [e, s] = k.split("/");
      return this.subCollection(e, "sessions").doc(s);
    });
    const docs = await this.db.getAll(...eventRefs, ...sessionRefs);
    const events = new Map<string, DocumentData>();
    const sessions = new Map<string, DocumentData>();
    docs.forEach((doc, i) => {
      if (!doc.exists) return;
      if (i < eventRefs.length) events.set(doc.id, doc.data()!);
      else sessions.set(sessionKeys[i - eventRefs.length], doc.data()!);
    });

    const iso = (v: unknown) => (v as Timestamp | undefined)?.toDate?.().toISOString();
    const items: UserRegistrationItem[] = [];
    for (const r of rows) {
      const ev = events.get(r.eventId);
      const ses = r.sessionId ? sessions.get(`${r.eventId}/${r.sessionId}`) : undefined;
      if (!ev || (r.sessionId && !ses)) continue;
      const src = ses ?? ev;
      const startDate = iso(src.startDate);
      const endDate = iso(src.endDate);
      if (!startDate || !endDate) continue;
      const loc = (ses?.location ?? ev.location) as { venue?: string; city?: { name?: string } } | undefined;
      items.push({
        eventId: r.eventId,
        ...(r.sessionId ? { sessionId: r.sessionId } : {}),
        title: (ses?.title as string) || (ev.title as string) || "Evento",
        ...(ses ? { eventTitle: ev.title as string } : {}),
        eventRef: (ev.slug as string) || r.eventId,
        ...(r.sessionId ? { sessionRef: (ses?.slug as string) || r.sessionId } : {}),
        image: (ses?.mainImage?.url as string) || (ev.mainImage?.url as string) || undefined,
        startDate,
        endDate,
        venue: loc?.venue || undefined,
        city: loc?.city?.name || undefined,
        status: r.data.status ?? "registered",
        checkedIn: Boolean(r.data.checkedInAt),
        requiresAttendance: src.requiresAttendance === true,
        registeredAt: iso(r.data.registeredAt) ?? startDate,
      });
    }
    return items;
  }

  /**
   * Devuelve el código de check-in de la inscripción propia (doc id = userId), creándolo
   * si falta. Exige inscripción vigente, evento/sesión sin terminar y `requiresAttendance`.
   */
  async getOrCreateCheckInCode(eventId: string, userId: string, sessionId?: string): Promise<CheckInCodeResult> {
    const eventRef = this.collection.doc(eventId);
    const targetRef = sessionId ? this.subCollection(eventId, "sessions").doc(sessionId) : eventRef;
    const regRef = targetRef.collection("registrations").doc(userId);

    return this.db.runTransaction(async (tx) => {
      const [regSnap, targetSnap, eventSnap] = await Promise.all([
        tx.get(regRef),
        tx.get(targetRef),
        sessionId ? tx.get(eventRef) : null,
      ]);
      if (!regSnap.exists || !targetSnap.exists) return { status: "not_found" };
      if (regSnap.get("status") === "canceled") return { status: "canceled" };
      const end = (targetSnap.get("endDate") as Timestamp | undefined)?.toDate();
      if (end && end.getTime() < Date.now()) return { status: "finished" };
      if (targetSnap.get("requiresAttendance") !== true) return { status: "no_attendance" };

      let code = regSnap.get("checkInCode") as string | undefined;
      if (!code) {
        code = generateCheckInCode(randomBytes);
        tx.update(regRef, { checkInCode: code });
      }
      const title = (targetSnap.get("title") as string) || (eventSnap?.get("title") as string) || "Evento";
      return { status: "ok", code, title };
    });
  }

  /**
   * Cancela la inscripción del usuario (doc id = userId, así que solo puede
   * cancelar la suya): status "canceled" + canceledAt y decrementa el contador
   * del evento/sesión (nunca bajo 0), todo en una transacción. Idempotente.
   */
  async cancelRegistration(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<CancelRegistrationResult> {
    const targetRef = sessionId
      ? this.subCollection(eventId, "sessions").doc(sessionId)
      : this.collection.doc(eventId);
    const regRef = targetRef.collection("registrations").doc(userId);

    return this.db.runTransaction(async (tx) => {
      const [regSnap, targetSnap] = await Promise.all([tx.get(regRef), tx.get(targetRef)]);
      if (!regSnap.exists || !targetSnap.exists) return "not_found";

      const entry = regSnap.data()!;
      const end = (targetSnap.get("endDate") as Timestamp | undefined)?.toDate();
      const block = cancelBlock({
        status: entry.status,
        checkedIn: Boolean(entry.checkedInAt),
        endDate: end ?? new Date(8.64e15),
      });
      if (block) return block;

      const current = Number(targetSnap.get("analytics.registrations") ?? 0);
      tx.update(regRef, {
        status: "canceled",
        canceledAt: FieldValue.serverTimestamp(),
        checkInCode: FieldValue.delete(), // un QR filtrado deja de servir; al reinscribirse se crea otro
      });
      tx.update(targetRef, {
        "analytics.registrations": Math.max(0, current - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return "ok";
    });
  }
}
