import type { INotificationRepository } from "@/domain/repository/notification/INotificationRepository";
import {
  NOTIFICATIONS_LIMIT,
  sanitizeNotification,
  type NewNotification,
  type NotificationItem,
} from "@/domain/entities/notification/Notification";

export class NotificationService {
  constructor(private readonly repository: INotificationRepository) {}

  /**
   * Avisa a `uid`. Nunca lanza: un aviso fallido no debe romper la acción que lo origina.
   * `id` hace el aviso idempotente (reintentos de webhook, doble clic).
   */
  async notify(uid: string | null | undefined, notification: NewNotification, id?: string): Promise<void> {
    if (!uid) return;
    try {
      await this.repository.add(uid, sanitizeNotification(notification), id);
    } catch (error) {
      console.error("[notify]", notification.type, error);
    }
  }

  list(uid: string): Promise<NotificationItem[]> {
    return this.repository.list(uid, NOTIFICATIONS_LIMIT);
  }

  countUnread(uid: string): Promise<number> {
    return this.repository.countUnread(uid);
  }

  markAllRead(uid: string): Promise<void> {
    return this.repository.markAllRead(uid);
  }
}
