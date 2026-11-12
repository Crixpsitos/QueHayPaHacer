import Link from "next/link"
import { ACTIVITY_CATEGORIES } from "@/domain/entities/activities/value-objects/ActivityCategory"
import type { UrlFilters } from "@/domain/entities/activities/filters"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import { filterHref } from "@/presentation/activities/lib/filterHref"

const SHOWN = 8

function Tile({ slug, name, count, current }: { slug: string; name: string; count: number; current: UrlFilters }) {
  const s = categoryStyle(slug)
  return (
    <li>
      <Link prefetch={false} href={filterHref(current, { category: slug })} className="group flex h-32 flex-col justify-between rounded-[1.5rem] p-4 outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0" style={{ background: s.bg, color: s.ink }}>
        <s.Icon className="size-8" strokeWidth={1.8} aria-hidden />
        <span className="grid leading-tight"><span className="font-heading text-lg font-bold">{name}</span><span className="text-xs font-semibold opacity-75">{count} {count === 1 ? "actividad" : "actividades"}</span></span>
      </Link>
    </li>
  )
}

/** Las 16 categorías como fichas de color: las que tienen más actividades primero; el resto, plegado. */
export function CategoryTiles({ counts, current }: { counts: Record<string, number>; current: UrlFilters }) {
  const sorted = [...ACTIVITY_CATEGORIES].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0) || a.name.localeCompare(b.name, "es"))
  const first = sorted.slice(0, SHOWN)
  const rest = sorted.slice(SHOWN)
  return (
    <section aria-labelledby="categorias" className="grid gap-4">
      <h2 id="categorias" className="font-heading text-2xl font-extrabold tracking-tight">¿Qué te provoca hacer?</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">{first.map((c) => <Tile key={c.slug} slug={c.slug} name={c.name} count={counts[c.slug] ?? 0} current={current} />)}</ul>
      {rest.length ? (
        <details>
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full border border-border bg-card px-5 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">Ver las {sorted.length} categorías</summary>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{rest.map((c) => <Tile key={c.slug} slug={c.slug} name={c.name} count={counts[c.slug] ?? 0} current={current} />)}</ul>
        </details>
      ) : null}
    </section>
  )
}
