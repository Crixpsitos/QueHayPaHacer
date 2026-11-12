import { timingSafeEqual } from "node:crypto"
import { canStamp, passportBadgesFor } from "@/domain/entities/activities/passport"
import type { IActivityStampRepository, Stamp } from "@/domain/repository/activities/IActivityStampRepository"

export interface StampDeps {
  repo: IActivityStampRepository
  isPublic: (activityId: string) => Promise<boolean>
  /** ¿Quien pide el QR gestiona la actividad (dueño, dueño del sitio o QHPA)? */
  canManage: (uid: string, activityId: string) => Promise<boolean>
  markVisited: (uid: string, activityId: string) => Promise<void>
  award: (uid: string, badgeId: string) => Promise<void>
  newToken: () => string
  clock: () => Date
}

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }
const bogotaDay = (d: Date) => new Date(d.getTime() - 5 * 3_600_000).toISOString().slice(0, 10)

/** Sellos del pasaporte: el QR del local (código por actividad) da una visita verificada, una sola vez por actividad. */
export class ActivityStampService {
  constructor(private readonly d: StampDeps) {}

  async qrToken(uid: string, activityId: string): Promise<string> {
    if (!(await this.d.canManage(uid, activityId))) throw new Error("Solo quien gestiona la actividad puede generar su QR de sello.")
    return this.d.repo.ensureToken(activityId, this.d.newToken())
  }

  async collect(uid: string, activityId: string, token: string): Promise<{ total: number }> {
    if (!uid?.trim()) throw new Error("Inicia sesión para sellar tu pasaporte.")
    if (!(await this.d.isPublic(activityId))) throw new Error("Esa actividad no existe.")
    const real = await this.d.repo.getToken(activityId)
    if (!real || typeof token !== "string" || !same(real, token)) throw new Error("Ese código de sello no es válido.")
    const now = this.d.clock(), day = bogotaDay(now)
    const stampsToday = await this.d.repo.countOnDay(uid, day)
    const error = canStamp({ alreadyStamped: false, stampsToday })
    if (error) throw new Error(error)
    const { created } = await this.d.repo.collect(uid, { activityId, at: now, day })
    if (!created) throw new Error(canStamp({ alreadyStamped: true, stampsToday }) as string)
    await this.d.markVisited(uid, activityId).catch(() => undefined)
    const total = (await this.d.repo.listMine(uid, 100)).length
    for (const b of passportBadgesFor(total)) await this.d.award(uid, b).catch(() => undefined)
    return { total }
  }

  listMine(uid: string, limit = 100): Promise<Stamp[]> { return this.d.repo.listMine(uid, limit) }
}
