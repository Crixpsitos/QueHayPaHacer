import Image from "next/image"
import Link from "@/app/components/ui/navigation/IntentLink"
import { cn } from "@/app/lib/utils/cn"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import type { ActivityCardView } from "@/presentation/activities/lib/publicView"
import { NextLine } from "@/presentation/activities/components/NextLine"

/** Tarjeta de actividad de los carriles del Home: categoría, quién la hace, cuándo es la próxima salida y el precio. */
export function RailActivityCard({ a, priority }: { a: ActivityCardView; priority?: boolean }) {
  const cat = categoryStyle(a.categorySlug)
  const price = a.priceFrom.startsWith("Desde") ? a.priceFrom.slice(6) : a.priceFrom
  return (
    <Link href={`/actividades/${a.slug}`} className="group block text-foreground outline-none">
      <span className="relative block h-44 overflow-hidden rounded-[1.125rem] group-focus-visible:ring-3 group-focus-visible:ring-ring/50 sm:h-51" style={a.coverUrl ? undefined : { background: cat.bg, color: cat.ink }}>
        {a.coverUrl ? <Image src={a.coverUrl} alt="" fill sizes="280px" priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" /> : <span className="grid size-full place-items-center"><cat.Icon className="size-12 opacity-60" aria-hidden /></span>}
        <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-wine">{a.categoryName}</span>
      </span>
      <span className="block px-0.5 pt-3">
        <span className="block truncate text-base font-semibold leading-snug group-hover:underline">{a.title}</span>
        <span className="block truncate text-sm text-muted-foreground">{a.owner ? `Con ${a.owner.displayName}` : `Con ${a.hostName}`}</span>
        <span className="block truncate text-muted-foreground [&_p]:truncate [&_p]:text-sm [&_p]:font-normal"><NextLine schedule={a.schedule} scheduleText={a.scheduleText} /></span>
        <span className={cn("mt-1.5 block text-[0.9375rem] font-semibold")}>{price}</span>
      </span>
    </Link>
  )
}
