"use server"

import type { ActivityFilters } from "@/domain/entities/activities/filters"
import { parseFilters } from "@/domain/entities/activities/filters"
import { fetchActivityPage, type ActivityPage } from "@/presentation/activities/data/fetchers"

type Wire = { category?: string; kind?: string; siteId?: string; cuando?: string; presupuesto?: string; con?: string }

/** "Ver más" del hub. Público: valida cada parámetro (vienen del cliente) con el mismo lector de la URL y no acepta nada fuera de lista. */
export async function loadMoreActivitiesAction(f: Wire, offset: number): Promise<ActivityPage> {
  const u = parseFilters({ categoria: f?.category, tipo: f?.kind === "site" ? "sitio" : f?.kind, cuando: f?.cuando, presupuesto: f?.presupuesto, con: f?.con })
  const siteId = typeof f?.siteId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(f.siteId) ? f.siteId : undefined
  const filters: ActivityFilters = { category: u.category, kind: u.kind, siteId, when: u.when, budget: u.budget, companion: u.companion }
  const safeOffset = Number.isInteger(offset) && offset >= 0 && offset <= 1000 ? offset : 0
  return fetchActivityPage(filters, safeOffset)
}
