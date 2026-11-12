import type { NotificationPrefs } from "@/domain/entities/notificationPrefs/prefs"

/** `users/{uid}/notificationPrefs/main` (privado: solo Admin SDK). */
export interface INotificationPrefsRepository {
  get(uid: string): Promise<NotificationPrefs | null>
  set(uid: string, prefs: NotificationPrefs): Promise<void>
  /** Quiénes aceptaron esta clase de correo (para los envíos programados). Máx. `limit`. */
  uidsWith(kind: "forYou" | "weekly", limit: number): Promise<string[]>
}
