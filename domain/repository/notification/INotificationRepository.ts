import type { NewNotification, NotificationItem } from "@/domain/entities/notification/Notification";

export interface INotificationRepository {
  /** Crea con `createdAt` de servidor. Con `id` es idempotente: si ya existe no hace nada. */
  add(uid: string, notification: NewNotification, id?: string): Promise<void>;
  /** Las más recientes primero. */
  list(uid: string, limit: number): Promise<NotificationItem[]>;
  countUnread(uid: string): Promise<number>;
  /** Marca como leídas todas las no leídas del usuario. */
  markAllRead(uid: string): Promise<void>;
}
