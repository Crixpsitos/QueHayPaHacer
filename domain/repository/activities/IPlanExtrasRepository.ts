import type { PlanItem, PlanItemKind } from "@/domain/entities/activities/planItem"

/** Eventos y sitios que la persona agregó a su plan: `users/{uid}/planItems/{event_<id>|site_<id>}`. */
export interface IPlanExtrasRepository {
  list(uid: string, limit: number): Promise<PlanItem[]>
  get(uid: string, kind: PlanItemKind, refId: string): Promise<PlanItem | null>
  put(uid: string, item: PlanItem): Promise<void>
  remove(uid: string, kind: PlanItemKind, refId: string): Promise<void>
}
