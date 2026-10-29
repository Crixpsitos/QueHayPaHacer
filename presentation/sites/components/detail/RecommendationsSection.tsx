import { Lightbulb } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"
import { SITE_TIP_LABELS, hasRecommendations, type SiteRecommendations } from "@/domain/entities/sites/value-objects/SiteRecommendations"

/**
 * Recomendaciones del autor (casillas + nota). Sin dato no pinta nada: nada de bloques vacíos.
 * `compact` = versión del modal (título más chico).
 */
export function RecommendationsSection({
  recommendations, compact = false, className,
}: {
  recommendations?: SiteRecommendations
  compact?: boolean
  className?: string
}) {
  if (!hasRecommendations(recommendations)) return null
  const { tips, note } = recommendations!
  const Heading = compact ? "h3" : "h2"
  return (
    <section className={className}>
      <Heading
        className={compact ? "mb-3 text-sm font-semibold text-[#09090B]" : "mb-3 text-lg font-semibold"}
        style={compact ? { fontFamily: "var(--font-heading)" } : undefined}
      >
        Recomendaciones
      </Heading>
      {tips.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tips.map((id) => (
            <li
              key={id}
              className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-[#FDF2F4] px-3 py-1.5 text-xs font-medium text-[#09090B] ring-1 ring-inset ring-[#F5C2C7]"
            >
              <Lightbulb className="size-3.5 shrink-0 text-[#D42F3C]" aria-hidden />
              <span className="[overflow-wrap:anywhere]">{SITE_TIP_LABELS[id]}</span>
            </li>
          ))}
        </ul>
      )}
      {note && (
        <p className={cn("text-sm text-[#52525B] [overflow-wrap:anywhere]", tips.length > 0 && "mt-3")}>{note}</p>
      )}
    </section>
  )
}
