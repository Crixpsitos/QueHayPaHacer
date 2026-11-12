"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/app/components/ui/button/button"
import { cn } from "@/app/lib/utils/cn"
import { getMyReviewAction } from "@/app/actions/activities/review.action"
import type { ReviewsData } from "@/presentation/activities/data/reviews"
import { filterReviews, type ReviewFilter } from "@/presentation/activities/lib/reviewFilters"
import type { ReviewView } from "@/presentation/activities/lib/reviewView"
import { ReviewCard } from "./ReviewCard"
import { ReviewForm } from "./ReviewForm"
import { ReviewStory } from "./ReviewStory"
import { ReviewSummary } from "./ReviewSummary"

type Mine = Awaited<ReturnType<typeof getMyReviewAction>>
const FILTERS: { id: ReviewFilter; label: string }[] = [{ id: "all", label: "Todas" }, { id: "photos", label: "Con fotos" }, { id: "5", label: "5 estrellas" }, { id: "recent", label: "Recientes" }]
const chip = "min-h-11 shrink-0 rounded-full border-[1.5px] px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40"

/** Sección de reseñas de la ficha. El estado de «mi reseña» se pide al abrir el formulario (la ficha se cachea por horas). */
export function ReviewsClient({ activityId, categorySlug, data, visitedLabel }: { activityId: string; categorySlug: string; data: ReviewsData; visitedLabel: string | null }) {
  const router = useRouter()
  const params = useSearchParams()
  const [filter, setFilter] = useState<ReviewFilter>("all")
  const [open, setOpen] = useState<ReviewView | null>(null)
  const [form, setForm] = useState(false)
  const [mine, setMine] = useState<Mine | null>(null)

  const openForm = async () => { setMine(await getMyReviewAction(activityId)); setForm(true) }
  useEffect(() => { if (params.get("resena") === "1") { const t = setTimeout(() => { void openForm() }, 0); return () => clearTimeout(t) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const list = filterReviews(data.reviews, filter)

  return (
    <section id="resenas" aria-labelledby="resenas-t" className="grid scroll-mt-24 gap-4">
      <h2 id="resenas-t" className="font-heading text-2xl font-extrabold tracking-tight">Lo que cuentan quienes fueron</h2>
      {data.summary.count ? (
        <>
          <ReviewSummary summary={data.summary} />
          {visitedLabel ? <p className="text-sm text-muted-foreground">{visitedLabel}. Las reseñas son opiniones de cada persona; no verificamos la asistencia.</p> : null}
          <div role="group" aria-label="Filtrar reseñas" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {FILTERS.map((f) => <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={cn(chip, filter === f.id ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card")}>{f.label}</button>)}
          </div>
          {list.length ? (
            <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 pt-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
              {list.map((r, i) => <ReviewCard key={r.key} r={r} i={i} categorySlug={categorySlug} onOpen={() => setOpen(r)} />)}
            </ul>
          ) : <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">No hay reseñas con ese filtro. <button type="button" onClick={() => setFilter("all")} className="font-semibold text-primary-dark underline">Ver todas</button></p>}
        </>
      ) : (
        <div className="grid justify-items-start gap-2 rounded-3xl border border-dashed border-border bg-card p-6">
          <p className="font-heading text-lg font-bold">Sé la primera persona en contar cómo fue</p>
          <p className="text-sm text-muted-foreground">Tu opinión ayuda a que otros decidan si ir.</p>
        </div>
      )}
      <Button type="button" size="lg" className="h-12 w-fit" onClick={() => void openForm()}>Escribir una reseña</Button>

      <ReviewStory r={open} onClose={() => setOpen(null)} />
      {form && mine ? (
        <ReviewForm key={mine.mine ? "edit" : "new"} open={form} onClose={() => setForm(false)} activityId={activityId} docId={mine.docId} loggedIn={mine.loggedIn} mine={mine.mine} blocked={mine.blocked}
          onDone={() => { setForm(false); router.refresh() }} />
      ) : null}
    </section>
  )
}
