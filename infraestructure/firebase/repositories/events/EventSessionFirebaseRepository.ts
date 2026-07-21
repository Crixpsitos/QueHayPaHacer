import {
  FieldValue,
  Filter,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type { IEventSessionFirebaseRepository } from "./IEventSessionFirebaseRepository";
import type { EventSession } from "@/domain/entities/events/EventSession";
import { EventSessionFirebaseMapper } from "../../mappers/events/EventSessionFirebaseMapper";
import type { FirebaseEventSessionDto } from "../../dto/events/FirebaseEventSessionDto";

export class EventSessionFirebaseRepository
  implements IEventSessionFirebaseRepository
{
  /** Solo para el lado de escritura (`toDto`); las lecturas devuelven DTO crudo. */
  private readonly mapper = new EventSessionFirebaseMapper();

  constructor(private readonly db: Firestore) {}

  /** Removes keys with undefined values so Firestore doesn't reject them. */
  private clean<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as T;
  }

  private sessionsCollection(eventId: string) {
    return this.db.collection("events").doc(eventId).collection("sessions");
  }

  async getByEventId(eventId: string): Promise<FirebaseEventSessionDto[]> {
    const snapshot = await this.sessionsCollection(eventId)
      .orderBy("startDate", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirebaseEventSessionDto,
    );
  }

  async getById(
    eventId: string,
    sessionId: string,
  ): Promise<FirebaseEventSessionDto | null> {
    const doc = await this.sessionsCollection(eventId).doc(sessionId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as FirebaseEventSessionDto;
  }

  async create(
    session: Omit<EventSession, "id" | "createdAt" | "updatedAt">,
  ): Promise<FirebaseEventSessionDto> {
    const col = this.sessionsCollection(session.eventId);
    const ref = col.doc();
    const now = FieldValue.serverTimestamp() as unknown as Timestamp;

    const dto = this.mapper.toDto({
      ...session,
      id: ref.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await ref.set(this.clean({ ...dto, id: ref.id, createdAt: now, updatedAt: now }));

    return { ...dto, id: ref.id };
  }

  async update(
    eventId: string,
    sessionId: string,
    data: Partial<Omit<EventSession, "id" | "eventId" | "createdAt">>,
  ): Promise<FirebaseEventSessionDto> {
    const ref = this.sessionsCollection(eventId).doc(sessionId);
    const now = FieldValue.serverTimestamp() as unknown as Timestamp;

    // Build partial DTO to merge
    const partial: Record<string, unknown> = { updatedAt: now };

    if (data.title !== undefined) partial.title = data.title;
    if (data.coverSource !== undefined) partial.coverSource = data.coverSource;
    if (data.mainImage !== undefined) partial.mainImage = data.mainImage;
    if (data.media !== undefined) partial.media = data.media;
    if (data.location !== undefined) {
      const tmpMapper = new EventSessionFirebaseMapper();
      const tmpDto = tmpMapper.toDto({
        id: sessionId,
        eventId,
        coverSource: "own",
        media: [],
        registrationType: "none",
        price: { isFree: true, amount: 0, currency: "COP" },
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(),
        ...data,
      } as EventSession);
      partial.location = tmpDto.location;
    }
    if (data.startDate !== undefined)
      partial.startDate = Timestamp.fromDate(data.startDate);
    if (data.endDate !== undefined)
      partial.endDate = Timestamp.fromDate(data.endDate);
    if (data.registrationType !== undefined)
      partial.registrationType = data.registrationType;
    if (data.externalUrl !== undefined) partial.externalUrl = data.externalUrl;
    if (data.capacity !== undefined) partial.capacity = data.capacity;
    if (data.requiresAttendance !== undefined)
      partial.requiresAttendance = data.requiresAttendance;
    if (data.registrationEventForm !== undefined)
      partial.registrationEventForm = data.registrationEventForm;
    if (data.price !== undefined) partial.price = data.price;
    if (data.status !== undefined) partial.status = data.status;

    await ref.set(partial, { merge: true });

    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirebaseEventSessionDto;
  }

  async delete(eventId: string, sessionId: string): Promise<void> {
    await this.sessionsCollection(eventId).doc(sessionId).delete();
  }

  async incrementCounter(
    eventId: string,
    sessionId: string,
    field: "views" | "registrations" | "shares",
    delta: number,
  ): Promise<void> {
    await this.sessionsCollection(eventId).doc(sessionId).set(
      {
        analytics: { [field]: FieldValue.increment(delta) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  async hasOverlap(
    eventId: string,
    startDate: Date,
    endDate: Date,
    excludeSessionId?: string,
  ): Promise<boolean> {
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);

    // Overlap condition: existing.startDate < newEnd AND existing.endDate > newStart
    const snapshot = await this.sessionsCollection(eventId)
      .where(
        Filter.and(
          Filter.where("startDate", "<", end),
          Filter.where("endDate", ">", start),
        ),
      )
      .get();

    const overlapping = snapshot.docs.filter(
      (doc) => doc.id !== excludeSessionId,
    );

    return overlapping.length > 0;
  }
}
