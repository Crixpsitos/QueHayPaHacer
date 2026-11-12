import type { JoinStatusValue } from "@/domain/entities/activities/activityJoin"
import type { ActivityCardView } from "./publicView"

export interface MyPlansView {
  upcoming: { card: ActivityCardView; key: string; status: JoinStatusValue }[]
  saved: ActivityCardView[]
  removedSaved: string[]
  done: ActivityCardView[]
  slots: Record<string, { date: string; time: string | null }>
}

/** «domingo 15 de noviembre»; salida sin fecha fija → null. */
export const planDateLabel = (key: string): string | null =>
  key === "open" ? null : new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date(`${key}T12:00:00-05:00`))
