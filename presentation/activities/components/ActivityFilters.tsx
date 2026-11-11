import Link from "next/link"
import { ACTIVITY_CATEGORIES } from "@/domain/entities/activities/value-objects/ActivityCategory"
import type { UrlFilters } from "@/domain/entities/activities/filters"
import { filterHref } from "@/presentation/activities/lib/filterHref"
import { cn } from "@/app/lib/utils/cn"

const pill = "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40"
const on = "border-transparent bg-foreground text-background"
const off = "border-border bg-card hover:bg-muted"

/** Filtros del hub como enlaces (funcionan sin JavaScript y se pueden compartir). */
export function ActivityFilters({ current }: { current: UrlFilters }) {
  return (
    <div className="grid gap-3">
      <nav aria-label="Tipo de actividad" className="flex gap-2 overflow-x-auto pb-1">
        {([[undefined, "Todas"], ["global", "Globales"], ["site", "De sitios"]] as const).map(([k, label]) => (
          <Link key={label} href={filterHref(current, { kind: k })} aria-current={current.kind === k ? "true" : undefined} className={cn(pill, current.kind === k ? on : off)}>{label}</Link>
        ))}
      </nav>
      <nav aria-label="Categorías" className="flex gap-2 overflow-x-auto pb-1">
        <Link href={filterHref(current, { category: undefined })} aria-current={!current.category ? "true" : undefined} className={cn(pill, !current.category ? on : off)}>Todas las categorías</Link>
        {ACTIVITY_CATEGORIES.map((c) => (
          <Link key={c.slug} href={filterHref(current, { category: c.slug })} aria-current={current.category === c.slug ? "true" : undefined} className={cn(pill, current.category === c.slug ? on : off)}>{c.name}</Link>
        ))}
      </nav>
    </div>
  )
}
