"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ImageIcon, Share2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { buildWeekPlan, weekPlanText, type WeekDay } from "@/domain/entities/activities/weekPlan"
import { planWeekPoster } from "@/domain/entities/activities/weekPoster"
import { WeekPosterDialog } from "./WeekPosterDialog"
import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { SITE_URL } from "@/app/lib/site"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import type { ActivityCardView } from "@/presentation/activities/lib/publicView"

const hourText = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` }
const dayLabel = (iso: string) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))

/**
 * «Tu semana»: lo que reservaste o guardaste, acomodado por día y hora, con los cruces marcados.
 * Todo se calcula en el navegador con lo que ya hay en tu cuenta (no se guarda nada nuevo) y se puede mandar por WhatsApp.
 */
export function WeekPlan({ cards, removableIds = [], onRemove }: { cards: ActivityCardView[]; /** Guardados que se pueden sacar del plan (las reservas se cancelan desde su actividad). */ removableIds?: string[]; onRemove?: (id: string) => void }) {
  const [week, setWeek] = useState<WeekDay[] | null>(null)
  const [poster, setPoster] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => { const now = new Date(); setWeek(buildWeekPlan(cards.map((c) => ({ id: c.id, title: c.title, schedule: c.schedule })), bogotaDateIso(now), now)) }, 0)
    return () => clearTimeout(t)
  }, [cards])

  if (!week) return <div className="h-40 animate-pulse rounded-3xl bg-muted" aria-hidden />
  const byId = new Map(cards.map((c) => [c.id, c]))
  // Lo que está disponible todos los días sin hora (cines, «siempre abierto»): una sola vez, no repetido en cada jornada.
  const daysOf = new Map<string, { n: number; timed: boolean }>()
  for (const d of week) for (const b of d.blocks) { const x = daysOf.get(b.id) ?? { n: 0, timed: false }; x.n++; if (b.startMin !== null) x.timed = true; daysOf.set(b.id, x) }
  const anytime = [...daysOf].filter(([, x]) => !x.timed && x.n >= 4).map(([id]) => id)
  const canRemove = (id: string) => Boolean(onRemove) && removableIds.includes(id)
  const removeBtn = (id: string, title: string) => canRemove(id) ? <button type="button" onClick={() => onRemove!(id)} aria-label={`Quitar ${title} de mi plan`} className="shrink-0 self-start rounded-full border border-current/40 px-2.5 py-1 text-xs font-semibold outline-none hover:bg-black/5 focus-visible:ring-2">Quitar</button> : null
  const total = week.reduce((n, d) => n + d.blocks.length, 0)
  if (!total) return (
    <div className="grid justify-items-start gap-2 rounded-3xl border border-border bg-card p-5">
      <h2 className="font-semibold">Tu semana está libre</h2>
      <p className="text-sm text-muted-foreground">Guarda o reserva actividades y aquí las verás ordenadas por día y hora.</p>
      <Button asChild className="h-12"><Link href="/actividades">Ver actividades</Link></Button>
    </div>
  )
  const share = `https://wa.me/?text=${encodeURIComponent(weekPlanText(week, "Mi semana en Ibagué", { link: (id) => `${SITE_URL}/actividades/${byId.get(id)?.slug}?ch=wa&utm_source=whatsapp&utm_medium=share&utm_campaign=mi_semana`, footer: `Arma la tuya en ${SITE_URL}/actividades` }))}`
  return (
    <div className="grid gap-4">
      <ol className="grid gap-4">
        {week.map((d) => ({ ...d, blocks: d.blocks.filter((b) => !anytime.includes(b.id)) })).map((d) => (
          <li key={d.date} className="grid gap-2">
            <h2 className="font-heading text-lg font-bold capitalize">{dayLabel(d.date)}</h2>
            <ul className="grid gap-2">
              {d.blocks.length === 0 ? <li className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card px-3 py-3 text-sm text-muted-foreground"><span>Día libre</span><Link href={`/actividades?dia=${d.date}`} prefetch={false} className="font-semibold text-primary-dark underline-offset-2 hover:underline">Ver qué hay</Link></li> : null}
              {d.blocks.map((b) => {
                const c = byId.get(b.id)!, st = categoryStyle(c.categorySlug)
                return (
                  <li key={`${b.id}-${b.startMin}`} className="grid gap-1.5 rounded-2xl p-3" style={{ background: st.bg, color: st.ink }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/actividades/${c.slug}`} className="flex min-w-0 items-baseline gap-3 outline-none focus-visible:underline">
                        <span className="w-16 shrink-0 font-heading text-sm font-bold">{b.startMin === null ? "Todo el día" : hourText(b.startMin)}</span>
                        <span className="font-heading font-semibold leading-snug">{c.title}</span>
                      </Link>
                      {removeBtn(b.id, c.title)}
                    </div>
                    {b.conflictsWith.length ? <p className="flex items-center gap-1.5 text-sm font-medium"><AlertTriangle className="size-4 shrink-0" aria-hidden />Se cruza con {b.conflictsWith.map((id) => byId.get(id)?.title).join(", ")}</p> : null}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
      {anytime.length ? (
        <section aria-label="Disponible toda la semana" className="grid gap-2">
          <h2 className="font-heading text-lg font-bold">Cuando quieras esta semana</h2>
          <ul className="grid gap-2">
            {anytime.map((id) => {
              const c = byId.get(id)!, st = categoryStyle(c.categorySlug)
              return (
                <li key={id} className="flex items-baseline justify-between gap-3 rounded-2xl p-3" style={{ background: st.bg, color: st.ink }}>
                  <Link href={`/actividades/${c.slug}`} className="grid min-w-0 outline-none focus-visible:underline"><span className="font-heading font-semibold leading-snug">{c.title}</span><span className="text-sm opacity-80">Sin hora fija · todos los días</span></Link>
                  {removeBtn(id, c.title)}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
      <Button type="button" className="h-12 w-full" onClick={() => setPoster(true)}><ImageIcon aria-hidden /> Afiche para compartir</Button>
      <Button asChild variant="outline" className="h-12 w-full"><a href={share} target="_blank" rel="noopener noreferrer"><Share2 aria-hidden /> Enviar mi semana por WhatsApp</a></Button>
      <WeekPosterDialog open={poster} onClose={() => setPoster(false)} plan={planWeekPoster(week, { today: week[0].date, price: (id) => (byId.get(id)?.priceFrom ?? "").replace("Desde ", "") || "Gratis", image: (id) => byId.get(id)?.coverUrl ?? null })} />
      <p className="text-xs text-muted-foreground">Incluye tus reservas y tus guardados de los próximos 7 días. El mensaje solo lleva títulos y horas.</p>
    </div>
  )
}
