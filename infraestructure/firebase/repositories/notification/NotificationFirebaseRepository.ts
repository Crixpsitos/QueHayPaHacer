import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { INotificationRepository } from "@/domain/repository/notification/INotificationRepository";
import {
  NOTIFICATION_TTL_DAYS,
  type NewNotification,
  type NotificationItem,
} from "@/domain/entities/notification/Notification";

const DAY_MS = 24 * 60 * 60 * 1000;
const ALREADY_EXISTS = 6; // código gRPC de Firestore

// ponytail: sin adapter/mapper; solo Admin SDK. Una sola igualdad u orderBy simple: sin índice compuesto.
export class NotificationFirebaseRepository extends FirebaseBaseRepository implements INotificationRepository {
  protected readonly collectionName = "users";

  constructor(db: Firestore) {
    super(db);
  }

  private of(uid: string) {
    return this.subCollection(uid, "notifications");
  }

  async add(uid: string, n: NewNotification, id?: string): Promise<void> {
    const data = {
      ...n,
      readAt: null,
      createdAt: FieldValue.serverTimestamp(),
      expireAt: Timestamp.fromMillis(Date.now() + NOTIFICATION_TTL_DAYS * DAY_MS),
    };
    if (!id) {
      await this.of(uid).add(data);
      return;
    }
    try {
      await this.of(uid).doc(id).create(data);
    } catch (e) {
      if ((e as { code?: number }).code !== ALREADY_EXISTS) throw e;
    }
  }

  async list(uid: string, limit: number): Promise<NotificationItem[]> {
    const snap = await this.of(uid).orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => ({
      id: d.id,
      type: d.get("type"),
      title: d.get("title") as string,
      ...(d.get("body") ? { body: d.get("body") as string } : {}),
      ...(d.get("href") ? { href: d.get("href") as string } : {}),
      read: d.get("readAt") != null,
      createdAt: (d.get("createdAt") as Timestamp | undefined)?.toMillis() ?? 0,
    }));
  }

  async countUnread(uid: string): Promise<number> {
    const snap = await this.of(uid).where("readAt", "==", null).count().get();
    return snap.data().count;
  }

  async markAllRead(uid: string): Promise<void> {
    // ponytail: hasta 400 por llamada (límite de batch); la campanita muestra 30, sobra.
    const snap = await this.of(uid).where("readAt", "==", null).limit(400).get();
    if (snap.empty) return;
    const batch = this.db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { readAt: FieldValue.serverTimestamp() }));
    await batch.commit();
  }
}
