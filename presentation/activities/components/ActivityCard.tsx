import Image from "next/image"
import Link from "next/link"
import type { ActivityCardView } from "@/presentation/activities/lib/publicView"
import { NextLine } from "./NextLine"

/** Tarjeta de actividad: qué es, cuándo es la próxima y cuánto cuesta. Toda la tarjeta es un solo enlace. */
export function ActivityCard({ a, priority }: { a: ActivityCardView; priority?: boolean }) {
  return (
    <li className="group">
      <Link href={`/actividades/${a.slug}`} className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card outline-none transition-shadow hover:shadow-hover focus-visible:ring-3 focus-visible:ring-ring/40">
        <div className="relative aspect-4/3 bg-muted">
          {a.coverUrl ? <Image src={a.coverUrl} alt={a.coverAlt} fill sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw" priority={priority} className="object-cover" /> : null}
          <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold shadow-subtle">{a.categoryName}</span>
          {a.badge ? <span className="absolute right-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background">{a.badge}</span> : null}
        </div>
        <div className="grid flex-1 content-start gap-1.5 p-4">
          <h3 className="font-heading text-lg font-semibold leading-snug group-hover:underline">{a.title}</h3>
          <p className="text-sm text-muted-foreground">{a.hostName}</p>
          <NextLine schedule={a.schedule} scheduleText={a.scheduleText} />
          <p className="text-sm">{a.priceFrom.startsWith("Desde") ? <>Desde <strong className="font-semibold">{a.priceFrom.slice(6)}</strong></> : <strong className="font-semibold">{a.priceFrom}</strong>}</p>
        </div>
      </Link>
    </li>
  )
}
