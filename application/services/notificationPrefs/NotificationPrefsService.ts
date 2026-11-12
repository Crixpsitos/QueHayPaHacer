import { applyPrefsInput, canSend, defaultPrefs, unsubscribeEmail, type NotificationPrefs, type PrefChannel, type PrefKind, type PrefsInput } from "@/domain/entities/notificationPrefs/prefs"
import type { INotificationPrefsRepository } from "@/domain/repository/notificationPrefs/INotificationPrefsRepository"

export class NotificationPrefsService {
  constructor(private readonly repo: INotificationPrefsRepository, private readonly legalVersion: string, private readonly clock: () => Date = () => new Date()) {}

  async get(uid: string): Promise<NotificationPrefs> { return (await this.repo.get(uid)) ?? defaultPrefs() }

  async save(uid: string, input: PrefsInput, authorized: boolean): Promise<NotificationPrefs> {
    const r = applyPrefsInput(await this.get(uid), input, { authorized, version: this.legalVersion, now: this.clock() })
    if (!r.ok) throw new Error(r.error)
    await this.repo.set(uid, r.prefs)
    return r.prefs
  }

  /** Baja con un clic (el enlace del correo ya validó la firma). Idempotente. */
  async unsubscribe(uid: string): Promise<void> { await this.repo.set(uid, unsubscribeEmail(await this.get(uid), this.clock())) }

  async allows(uid: string, channel: PrefChannel, kind: PrefKind): Promise<boolean> { return canSend(await this.get(uid), channel, kind) }

  uidsWith(kind: "forYou" | "weekly", limit = 500): Promise<string[]> { return this.repo.uidsWith(kind, limit) }
}
