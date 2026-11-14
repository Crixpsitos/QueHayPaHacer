import { Firestore } from "firebase-admin/firestore";
import type { Escapada } from "@/domain/entities/escapadas/Escapada";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";

export class EscapadasFirebaseRepository extends FirebaseBaseRepository {
  protected collectionName = "escapadas";

  constructor(db: Firestore) {
    super(db);
  }

  /** Activas, en el orden que puso el administrador. Se ordena en memoria: son pocas y así no pide índice. */
  async findActive(): Promise<Escapada[]> {
    const snap = await this.collection.where("isActive", "==", true).get();
    return snap.docs
      .map((d): Escapada => {
        const x = d.data();
        return {
          id: d.id,
          name: String(x.name ?? ""),
          slug: String(x.slug ?? d.id),
          minutesAway: Number(x.minutesAway ?? 0),
          coverUrl: typeof x.coverUrl === "string" && x.coverUrl ? x.coverUrl : null,
          eventIds: Array.isArray(x.eventIds) ? x.eventIds.filter((i: unknown): i is string => typeof i === "string") : [],
          order: Number(x.order ?? 0),
        };
      })
      .filter((e) => e.name)
      .sort((a, b) => a.order - b.order || a.minutesAway - b.minutesAway);
  }
}
