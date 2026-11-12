import Link from "next/link"
import { MapPin } from "lucide-react"
import { HowToGetThere } from "@/presentation/sites/components/detail/HowToGetThere"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import type { ActivityPageData } from "@/presentation/activities/data/fetchers"
import { PlaceMapLazy } from "./PlaceMapLazy"

const h2 = "font-heading text-2xl font-extrabold tracking-tight"

/**
 * «Dónde es»: el lugar como mapa. Sitio vinculado → mapa en el sitio y su tarjeta; actividad global con punto fijo → mapa en ese punto.
 * Si el punto «se dice en el grupo» o «cambia», no se publica ningún pin: queda el aviso de siempre.
 */
export function ActivityPlace({ d, compact }: { d: ActivityPageData; compact?: boolean }) {
  const geo = d.kind === "site" ? d.site?.geo ?? null : d.meetingGeo
  const cat = categoryStyle(d.categorySlug)
  if (!geo && d.kind === "site" && !d.site) return null
  const hasMeetingText = d.meeting.mode === "fixed" ? d.meeting.text.trim().length > 0 : true
  if (!geo && !(d.kind === "global" && hasMeetingText)) return null
  const where = d.kind === "site" ? d.site?.name ?? "" : d.meeting.text
  return (
    <section aria-labelledby="donde" className="grid gap-3">
      <h2 id="donde" className={h2}>Dónde es</h2>
      <div className={compact ? "grid gap-3 lg:grid-cols-[1.5fr_1fr]" : "contents"}>
      {geo ? (
        <div className={`overflow-hidden rounded-3xl border border-border bg-muted ${compact ? "h-56 lg:h-full lg:min-h-64" : "h-56 sm:h-72"}`}>
          <PlaceMapLazy latitude={geo.latitude} longitude={geo.longitude} bg={cat.bg} ink={cat.ink} label={`Mapa: ${where}`} />
        </div>
      ) : null}
      <div className={compact ? "grid content-start gap-3" : "contents"}>
      {d.kind === "site" && d.site ? (
        <Link href={`/donde-ir/${d.site.slug}`} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: cat.bg, color: cat.ink }}><MapPin className="size-5" aria-hidden /></span>
          <span className="grid min-w-0 leading-tight"><span className="truncate font-heading text-base font-bold">{d.site.name}</span>{d.site.address ? <span className="truncate text-sm text-muted-foreground">{d.site.address}</span> : null}</span>
          <span className="ml-auto shrink-0 text-sm font-semibold text-primary-dark">Ver el sitio</span>
        </Link>
      ) : null}
      {d.kind === "site" && d.meeting.mode === "fixed" && !d.meeting.references ? null : (
      <div className="flex gap-4 rounded-3xl border border-[#F6DDA0] bg-accent p-5 text-foreground">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFB703] text-[#5C0011]"><MapPin className="size-6" aria-hidden /></span>
        <div className="grid content-center gap-0.5 leading-snug">
          {d.meeting.note ? <p className="text-lg font-semibold">{d.meeting.note}</p> : d.meeting.text ? <><p className="font-heading text-xl font-bold">{d.meeting.text}</p>{d.meeting.references ? <p className="text-sm text-muted-foreground">{d.meeting.references}</p> : null}</> : <p className="text-lg font-semibold">Nos vemos en {where}.</p>}
        </div>
      </div>
      )}
      {geo ? <HowToGetThere destination={geo} /> : null}
      </div>
      </div>
    </section>
  )
}
