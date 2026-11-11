import Image from "next/image"
import Link from "next/link"
import type { ActivityCardView } from "@/presentation/activities/lib/publicView"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import { NextLine } from "./NextLine"

/** Tarjeta de actividad: foto grande, categoría con su color, precio en la foto y la próxima salida. Toda la tarjeta es un enlace. */
export function ActivityCard({ a, priority }: { a: ActivityCardView; priority?: boolean }) {
  const cat = categoryStyle(a.categorySlug)
  const price = a.priceFrom.startsWith("Desde") ? a.priceFrom.slice(6) : a.priceFrom
  return (
    <li className="group">
      <Link href={`/actividades/${a.slug}`} className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-card outline-none transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-hover focus-visible:ring-3 focus-visible:ring-ring/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          {a.coverUrl ? <Image src={a.coverUrl} alt={a.coverAlt} fill sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw" priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" /> : <div className="grid size-full place-items-center" style={{ background: cat.bg, color: cat.ink }}><cat.Icon className="size-14 opacity-60" aria-hidden /></div>}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-subtle" style={{ background: cat.bg, color: cat.ink }}><cat.Icon className="size-3.5" aria-hidden />{a.categoryName}</span>
          {a.badge && a.badge !== "Gratis" ? <span className="absolute right-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background">{a.badge}</span> : null}
          <span className="absolute bottom-3 right-3 rounded-xl bg-foreground px-3 py-1.5 text-[0.8125rem] font-semibold text-background shadow-subtle">{price}</span>
        </div>
        <div className="grid flex-1 content-start gap-1 p-4">
          <h3 className="font-heading text-xl font-bold leading-snug tracking-tight">{a.title}</h3>
          <p className="text-sm text-muted-foreground">{a.hostName}</p>
          <div className="mt-1"><NextLine schedule={a.schedule} scheduleText={a.scheduleText} /></div>
        </div>
      </Link>
    </li>
  )
}
