import Image from "next/image"
import Link from "next/link"
import type { AgendaDayView } from "@/presentation/activities/data/fetchers"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"

const dayTitle = (iso: string) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** "18:30" → ["6:30", "p. m."] */
function clock(hhmm: string): [string, string] {
  const [h, m] = hhmm.split(":").map(Number)
  return [`${h % 12 || 12}:${String(m).padStart(2, "0")}`, h < 12 ? "a. m." : "p. m."]
}

/** Agenda por horas: la hora a la izquierda, como una cartelera. Lo que no tiene hora fija va al final del día. */
export function AgendaView({ days, showDayTitles }: { days: AgendaDayView[]; showDayTitles: boolean }) {
  return (
    <div className="grid gap-9">
      {days.map((d) => (
        <section key={d.date} aria-label={cap(dayTitle(d.date))} className="grid gap-4">
          {showDayTitles ? <h2 className="font-heading text-2xl font-extrabold tracking-tight">{cap(dayTitle(d.date))}</h2> : null}
          <ol className="grid gap-4">
            {d.entries.map((e, i) => {
              const cat = categoryStyle(e.card.categorySlug)
              const [t, ap] = e.hhmm ? clock(e.hhmm) : ["Todo", "el día"]
              return (
                <li key={`${e.card.id}-${e.hhmm ?? i}`} className="grid grid-cols-[4.25rem_1fr] items-start gap-3 sm:gap-6">
                  <div className="pt-3 text-right leading-none"><span className="font-heading text-[1.375rem] font-bold">{t}</span><span className="mt-1 block text-xs font-medium text-muted-foreground">{ap}</span></div>
                  <Link href={`/actividades/${e.card.slug}`} className="group relative flex overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-card outline-none transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-hover focus-visible:ring-3 focus-visible:ring-ring/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <span className="relative w-24 shrink-0 bg-muted min-[420px]:w-36 sm:w-48">
                      {e.card.coverUrl ? <Image src={e.card.coverUrl} alt="" fill sizes="(min-width: 640px) 192px, 144px" className="object-cover transition-transform duration-500 group-hover:scale-[1.05] motion-reduce:transition-none" /> : <span className="grid size-full place-items-center" style={{ background: cat.bg, color: cat.ink }}><cat.Icon className="size-10 opacity-60" aria-hidden /></span>}
                    </span>
                    <span className="grid min-w-0 flex-1 content-center gap-1 p-4">
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: cat.bg, color: cat.ink }}><cat.Icon className="size-3.5" aria-hidden />{e.card.categoryName}</span>
                      <span className="font-heading text-xl font-bold leading-snug tracking-tight">{e.card.title}</span>
                      <span className="text-sm text-muted-foreground">{e.card.hostName}</span>
                      <span className="mt-0.5 text-sm font-semibold">{e.card.priceFrom}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
