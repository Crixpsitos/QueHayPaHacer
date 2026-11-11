import Link from "next/link"
import { ACTIVITY_CATEGORIES, COMPANIONS, type Companion } from "@/domain/entities/activities/value-objects/ActivityCategory"
import type { BudgetBand } from "@/domain/entities/activities/value-objects/Budget"
import { WHEN_VALUES, type When } from "@/domain/entities/activities/when"
import type { UrlFilters } from "@/domain/entities/activities/filters"
import { filterHref } from "@/presentation/activities/lib/filterHref"
import { cn } from "@/app/lib/utils/cn"

const pill = "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40"
const on = "border-transparent bg-foreground text-background"
const off = "border-border bg-card hover:bg-muted"

export const WHEN_LABELS: Record<When, string> = { hoy: "Hoy", "este-fin-de-semana": "Este fin de semana", "esta-semana": "Esta semana" }
export const BUDGET_LABELS: Record<BudgetBand, string> = { gratis: "Gratis", "hasta-20000": "Hasta $20.000", "hasta-50000": "Hasta $50.000", "hasta-100000": "Hasta $100.000", "mas-de-100000": "Más de $100.000" }
const COMPANION_LABELS: Record<Companion, string> = { solo: "Solo", pareja: "Pareja", familia: "Familia", amigos: "Amigos", ninos: "Niños", mascotas: "Mascotas" }
const BUDGET_SHOWN: BudgetBand[] = ["gratis", "hasta-20000", "hasta-50000", "hasta-100000"]

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav aria-label={label} className="grid gap-2">
      <span className="text-[0.8125rem] font-semibold text-muted-foreground">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1">{children}</div>
    </nav>
  )
}

function Chip({ current, patch, active, children }: { current: UrlFilters; patch: Parameters<typeof filterHref>[1]; active: boolean; children: React.ReactNode }) {
  // Un toque en el chip activo lo quita; en otro, lo cambia.
  const key = Object.keys(patch)[0] as keyof UrlFilters
  const href = active ? filterHref(current, { [key]: undefined }) : filterHref(current, patch)
  return <Link href={href} scroll={false} aria-current={active ? "true" : undefined} className={cn(pill, active ? on : off)}>{children}</Link>
}

/** Filtros del hub como enlaces (funcionan sin JavaScript y se pueden compartir). Cada cambio vive en la dirección. */
export function ActivityFilters({ current }: { current: UrlFilters }) {
  const active: { label: string; href: string }[] = [
    ...(current.when ? [{ label: WHEN_LABELS[current.when], href: filterHref(current, { when: undefined }) }] : []),
    ...(current.budget ? [{ label: BUDGET_LABELS[current.budget], href: filterHref(current, { budget: undefined }) }] : []),
    ...(current.companion ? [{ label: COMPANION_LABELS[current.companion], href: filterHref(current, { companion: undefined }) }] : []),
    ...(current.category ? [{ label: ACTIVITY_CATEGORIES.find((c) => c.slug === current.category)?.name ?? "", href: filterHref(current, { category: undefined }) }] : []),
    ...(current.kind ? [{ label: current.kind === "global" ? "Globales" : "De sitios", href: filterHref(current, { kind: undefined }) }] : []),
  ]
  return (
    <div className="grid gap-4">
      <Group label="Cuándo">
        {WHEN_VALUES.map((w) => <Chip key={w} current={current} patch={{ when: w }} active={current.when === w}>{WHEN_LABELS[w]}</Chip>)}
        <Chip current={current} patch={{ when: undefined }} active={!current.when}>Cualquier día</Chip>
      </Group>
      <Group label="Presupuesto">
        {BUDGET_SHOWN.map((b) => <Chip key={b} current={current} patch={{ budget: b }} active={current.budget === b}>{BUDGET_LABELS[b]}</Chip>)}
      </Group>
      <Group label="Con quién">
        {COMPANIONS.map((c) => <Chip key={c} current={current} patch={{ companion: c }} active={current.companion === c}>{COMPANION_LABELS[c]}</Chip>)}
      </Group>
      <Group label="Categoría">
        <Chip current={current} patch={{ category: undefined }} active={!current.category}>Todas</Chip>
        {ACTIVITY_CATEGORIES.map((c) => <Chip key={c.slug} current={current} patch={{ category: c.slug }} active={current.category === c.slug}>{c.name}</Chip>)}
      </Group>
      <Group label="Tipo">
        {([[undefined, "Todas"], ["global", "Globales"], ["site", "De sitios"]] as const).map(([k, label]) => (
          <Chip key={label} current={current} patch={{ kind: k }} active={current.kind === k}>{label}</Chip>
        ))}
      </Group>
      {active.length ? (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtros activos">
          {active.map((a) => <Link key={a.label} href={a.href} scroll={false} aria-label={`Quitar filtro ${a.label}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary-light px-3 text-[0.8125rem] font-semibold text-primary-dark outline-none focus-visible:ring-3 focus-visible:ring-ring/40">{a.label} <span aria-hidden>✕</span></Link>)}
          <Link href="/actividades" scroll={false} className="text-[0.8125rem] font-semibold text-primary-dark underline-offset-2 hover:underline">Quitar todo</Link>
        </div>
      ) : null}
    </div>
  )
}
