import type { Activity } from "@/domain/entities/activities/Activity"
import { holdsSpot, type JoinStatusValue } from "@/domain/entities/activities/activityJoin"
import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"

export interface PlansDeps {
  savedIds: (uid: string, limit: number) => Promise<string[]>
  visitedIds: (uid: string, limit: number) => Promise<string[]>
  slots: (uid: string) => Promise<Record<string, { date: string; time: string | null }>>
  joins: (uid: string) => Promise<{ activityId: string; key: string; status: JoinStatusValue }[]>
  getPublic: (activityId: string) => Promise<Activity | null>
  clock: () => Date
}

export interface UpcomingPlan { activity: Activity; key: string; status: JoinStatusValue }
export interface MyPlans {
  upcoming: UpcomingPlan[]
  saved: Activity[]
  /** Guardadas que ya no son públicas: la persona puede quitarlas de su lista. */
  removedSaved: string[]
  done: Activity[]
  /** Día y hora que la persona eligió para ir, por actividad guardada. */
  slots: Record<string, { date: string; time: string | null }>
}

const LIMIT = 100

/** "Mis planes": lo que la persona reservó, guardó y marcó «Yo fui». Solo lee datos de su propia cuenta. */
export class ActivityPlansService {
  constructor(private readonly d: PlansDeps) {}

  async mine(uid: string): Promise<MyPlans> {
    if (!uid?.trim()) return { upcoming: [], saved: [], removedSaved: [], done: [], slots: {} }
    const today = bogotaDateIso(this.d.clock())
    const [savedIds, visitedIds, joins, slots] = await Promise.all([this.d.savedIds(uid, LIMIT), this.d.visitedIds(uid, LIMIT), this.d.joins(uid), this.d.slots(uid)])
    const cache = new Map<string, Promise<Activity | null>>()
    const pub = (id: string) => (cache.has(id) ? cache.get(id)! : (cache.set(id, this.d.getPublic(id)), cache.get(id)!))

    const live = joins.filter((j) => holdsSpot(j.status) && (j.key === "open" || j.key >= today))
    const upcoming = (await Promise.all(live.map(async (j) => ({ j, a: await pub(j.activityId) }))))
      .flatMap(({ j, a }) => (a ? [{ activity: a, key: j.key, status: j.status }] : []))
      .sort((x, y) => (x.key === "open" ? "9999" : x.key).localeCompare(y.key === "open" ? "9999" : y.key))

    const savedList = await Promise.all(savedIds.map(async (id) => ({ id, a: await pub(id) })))
    const doneList = await Promise.all(visitedIds.map((id) => pub(id)))
    return {
      upcoming,
      saved: savedList.flatMap((s) => (s.a ? [s.a] : [])),
      removedSaved: savedList.filter((s) => !s.a).map((s) => s.id),
      done: doneList.flatMap((a) => (a ? [a] : [])),
      slots,
    }
  }
}
