import Image from "next/image"
import Link from "@/app/components/ui/navigation/IntentLink"
import { cn } from "@/app/lib/utils/cn"
import { compactCount } from "@/presentation/events/components/card/cardMeta"
import type { SiteTodayView } from "../lib/buildHomeView"

const FALLBACK = ["bg-brand-gold", "bg-primary-dark", "bg-sand", "bg-primary", "bg-wine"]

/** Tarjeta de sitio de los carriles del Home: categoría, si está abierto, cuántos eventos tiene, dirección, horario de hoy, qué pasa hoy ahí, me gusta y fotos. */
export function RailSiteCard({ s, index }: { s: SiteTodayView; index: number }) {
  return (
    <Link href={s.href} className="group block text-foreground outline-none">
      <span className={cn("relative block h-44 overflow-hidden rounded-[1.125rem] group-focus-visible:ring-3 group-focus-visible:ring-ring/50 sm:h-51", !s.cover && FALLBACK[index % FALLBACK.length])}>
        {s.cover ? <Image src={s.cover} alt="" fill sizes="280px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" /> : null}
        <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-wine">{s.kind}</span>
        <span className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-green-900">{s.open}</span>
          {s.eventCount > 0 ? <span className="rounded-full bg-brand-gold px-2.5 py-1 text-xs font-semibold text-wine">{s.eventCount} {s.eventCount === 1 ? "evento" : "eventos"}</span> : null}
        </span>
      </span>
      <span className="block px-0.5 pt-3">
        <span className="block truncate text-base font-semibold leading-snug group-hover:underline">{s.name}</span>
        {s.address ? <span className="block truncate text-sm text-muted-foreground">{s.address}</span> : null}
        {s.hours ? <span className="block truncate text-sm text-muted-foreground">{s.hours}</span> : null}
        {s.live ? (
          <span className="mt-1 block truncate text-[0.8125rem] font-medium text-wine">
            <span aria-hidden className="mr-2 inline-block size-2 rounded-full bg-brand-gold" />
            {s.live}
          </span>
        ) : null}
        <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2.5">
          <span className="whitespace-nowrap text-[0.9375rem] font-semibold">{compactCount(s.likes)} me gusta</span>
          <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
            {s.eventCount > 0 ? `${s.eventCount} ${s.eventCount === 1 ? "evento" : "eventos"}` : null}
            {s.eventCount > 0 && s.photos > 0 ? " · " : null}
            {s.photos > 0 ? `${s.photos} fotos` : null}
          </span>
        </span>
      </span>
    </Link>
  )
}
