"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button/button"
import { loadMoreActivitiesAction } from "@/app/actions/activities/load-more-activities.action"
import type { ActivityPage } from "@/presentation/activities/data/fetchers"
import type { ActivityCardView } from "@/presentation/activities/lib/publicView"
import { ActivityCard } from "./ActivityCard"

/** Lista del hub con "Ver más" (12 por página). La primera página llega ya renderizada desde el servidor. */
export function ActivityList({ first, filters }: { first: ActivityPage; filters: { category?: string; kind?: string; siteId?: string; cuando?: string; dia?: string; presupuesto?: string; con?: string } }) {
  const [items, setItems] = useState<ActivityCardView[]>(first.items)
  const [next, setNext] = useState<number | null>(first.nextOffset)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const more = async () => {
    if (next === null) return
    setBusy(true)
    setError(false)
    try {
      const r = await loadMoreActivitiesAction(filters, next)
      setItems((x) => [...x, ...r.items.filter((n) => !x.some((o) => o.id === n.id))])
      setNext(r.nextOffset)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((a, i) => <ActivityCard key={a.id} a={a} priority={i < 3} />)}</ul>
      {error ? <p role="alert" className="text-center text-sm font-medium text-destructive">No se pudieron cargar más. Inténtalo de nuevo.</p> : null}
      {next !== null ? <Button type="button" variant="outline" size="lg" className="mx-auto h-12 px-8" disabled={busy} onClick={() => void more()}>{busy ? "Cargando…" : "Ver más"}</Button> : null}
    </div>
  )
}
