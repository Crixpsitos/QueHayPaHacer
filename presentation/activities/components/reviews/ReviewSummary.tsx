import { Stars } from "./Stars"
import type { ReviewsData } from "@/presentation/activities/data/reviews"

/** Promedio grande en vinotinto y la distribución por estrellas. */
export function ReviewSummary({ summary }: { summary: ReviewsData["summary"] }) {
  return (
    <div className="flex items-center gap-5 rounded-3xl border border-border bg-card p-5">
      <div className="grid shrink-0 justify-items-center gap-1">
        <span className="font-heading text-5xl font-extrabold leading-none text-primary-dark">{summary.average}</span>
        <Stars value={Math.round(Number(summary.average?.replace(",", ".")))} />
        <span className="text-sm text-muted-foreground">{summary.count} {summary.count === 1 ? "reseña" : "reseñas"}</span>
      </div>
      <ul className="grid flex-1 gap-1.5" aria-label="Reseñas por estrellas">
        {[5, 4, 3, 2, 1].map((n) => (
          <li key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-3 shrink-0 text-right">{n}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary-dark" style={{ width: `${summary.percent[n - 1]}%` }} /></span>
            <span className="w-8 shrink-0 text-right">{summary.percent[n - 1]}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
