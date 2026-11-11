"use server"

import { isActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { fetchActivityPage, type ActivityPage } from "@/presentation/activities/data/fetchers"

/** "Ver más" del hub. Público: valida cada parámetro (vienen del cliente) y no acepta nada que no sea de la lista. */
export async function loadMoreActivitiesAction(f: { category?: string; kind?: string; siteId?: string }, offset: number): Promise<ActivityPage> {
  const category = f?.category && isActivityCategory(f.category) ? f.category : undefined
  const kind = f?.kind === "global" || f?.kind === "site" ? f.kind : undefined
  const siteId = typeof f?.siteId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(f.siteId) ? f.siteId : undefined
  const safeOffset = Number.isInteger(offset) && offset >= 0 && offset <= 1000 ? offset : 0
  return fetchActivityPage(category, kind, siteId, safeOffset)
}
