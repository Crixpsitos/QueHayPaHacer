import Image from "next/image"
import Link from "next/link"
import { fetchMoreToDo, type MoreLevelView, type MoreRow } from "@/presentation/activities/data/fetchers"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import { NextLine } from "@/presentation/activities/components/NextLine"
import { MoreToDoTabs } from "./MoreToDoTabs"

const TITLES: Record<MoreLevelView["key"], { title: string; tab: string }> = {
  here: { title: "Aquí mismo", tab: "Aquí" },
  group: { title: "Del mismo grupo", tab: "Del grupo" },
  near: { title: "A menos de 1 km", tab: "Cerca" },
  similar: { title: "Parecidas", tab: "Parecidas" },
  city: { title: "En Ibagué", tab: "En Ibagué" },
}

const distance = (m: number | null) => (m === null ? "" : m < 100 ? "0 m" : m < 1000 ? `${Math.round(m / 50) * 50} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0).replace(".", ",")} km`)

/** Las filas miden lo mismo (72 px) y el texto se corta con «…»: así las tres tarjetas nunca quedan desiguales. */
function Row({ r }: { r: MoreRow }) {
  const cat = categoryStyle(r.categorySlug)
  return (
    <li className="border-t border-border/60 first:border-t-0">
      <Link href={`/actividades/${r.slug}`} className="flex h-18 items-center gap-3 px-3.5 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/40">
        <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[0.875rem]" style={{ background: cat.bg, color: cat.ink }}>
          {r.coverUrl ? <Image src={r.coverUrl} alt="" fill sizes="48px" className="object-cover" /> : <cat.Icon className="size-5" aria-hidden />}
        </span>
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate font-heading text-[0.9375rem] font-semibold">{r.title}</span>
          <div className="truncate text-[0.8125rem] text-muted-foreground"><NextLine schedule={r.schedule} scheduleText={r.scheduleText} /></div>
        </span>
        <span className="w-12 shrink-0 text-right text-[0.8125rem] font-semibold">{distance(r.meters)}</span>
      </Link>
    </li>
  )
}

/** Tarjeta de alto fijo: 48 px de encabezado + 3 filas de 72 px (ROWS_PER_LEVEL). */
function LevelCard({ level }: { level: MoreLevelView }) {
  return (
    <section aria-label={TITLES[level.key].title} className="h-69 overflow-hidden rounded-3xl border border-border bg-card">
      <h3 className="flex h-12 items-center justify-between px-3.5 font-heading text-base font-bold">{TITLES[level.key].title}<span className="text-[0.8125rem] font-semibold text-muted-foreground">{level.total}</span></h3>
      <ul>{level.rows.map((r) => <Row key={r.id} r={r} />)}</ul>
    </section>
  )
}

/** «Más para hacer»: aquí mismo / del grupo → cerca / parecidas → en Ibagué. No se dibuja vacío. */
export async function MoreToDo({ id }: { id: string }) {
  const levels = await fetchMoreToDo(id)
  if (!levels.length) return null
  return (
    <section aria-labelledby="mas" className="grid gap-4">
      <h2 id="mas" className="font-heading text-2xl font-extrabold tracking-tight">Más para hacer</h2>
      <MoreToDoTabs tabs={levels.map((l) => ({ key: l.key, label: TITLES[l.key].tab, count: l.total, content: <LevelCard level={l} /> }))} />
    </section>
  )
}
