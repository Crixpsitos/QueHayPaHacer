"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Share2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { buildWeekPlan, weekPlanText, type WeekDay } from "@/domain/entities/activities/weekPlan"
import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import type { ActivityCardView } from "@/presentation/activities/lib/publicView"

const hourText = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` }
const dayLabel = (iso: string) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))

/**
 * «Tu semana»: lo que reservaste o guardaste, acomodado por día y hora, con los cruces marcados.
 * Todo se calcula en el navegador con lo que ya hay en tu cuenta (no se guarda nada nuevo) y se puede mandar por WhatsApp.
 */
export function WeekPlan({ cards }: { cards: ActivityCardView[] }) {
  const [week, setWeek] = useState<WeekDay[] | null>(null)
  useEffect(() => {
    const t = setTimeout(() => { const now = new Date(); setWeek(buildWeekPlan(cards.map((c) => ({ id: c.id, title: c.title, schedule: c.schedule })), bogotaDateIso(now), now)) }, 0)
    return () => clearTimeout(t)
  }, [cards])

  if (!week) return <div className="h-40 animate-pulse rounded-3xl bg-muted" aria-hidden />
  const byId = new Map(cards.map((c) => [c.id, c]))
  const total = week.reduce((n, d) => n + d.blocks.length, 0)
  if (!total) return (
    <div className="grid justify-items-start gap-2 rounded-3xl border border-border bg-card p-5">
      <h2 className="font-semibold">Tu semana está libre</h2>
      <p className="text-sm text-muted-foreground">Guarda o reserva actividades y aquí las verás ordenadas por día y hora.</p>
      <Button asChild className="h-12"><Link href="/actividades">Ver actividades</Link></Button>
    </div>
  )
  const share = `https://wa.me/?text=${encodeURIComponent(weekPlanText(week, "Mi semana en Ibagué"))}`
  return (
    <div className="grid gap-4">
      <ol className="grid gap-4">
        {week.filter((d) => d.blocks.length).map((d) => (
          <li key={d.date} className="grid gap-2">
            <h2 className="font-heading text-lg font-bold capitalize">{dayLabel(d.date)}</h2>
            <ul className="grid gap-2">
              {d.blocks.map((b) => {
                const c = byId.get(b.id)!, st = categoryStyle(c.categorySlug)
                return (
                  <li key={`${b.id}-${b.startMin}`} className="grid gap-1.5 rounded-2xl p-3" style={{ background: st.bg, color: st.ink }}>
                    <Link href={`/actividades/${c.slug}`} className="flex items-baseline gap-3 outline-none focus-visible:underline">
                      <span className="w-16 shrink-0 font-heading text-sm font-bold">{b.startMin === null ? "Todo el día" : hourText(b.startMin)}</span>
                      <span className="font-heading font-semibold leading-snug">{c.title}</span>
                    </Link>
                    {b.conflictsWith.length ? <p className="flex items-center gap-1.5 text-sm font-medium"><AlertTriangle className="size-4 shrink-0" aria-hidden />Se cruza con {b.conflictsWith.map((id) => byId.get(id)?.title).join(", ")}</p> : null}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
      <Button asChild variant="outline" className="h-12 w-full"><a href={share} target="_blank" rel="noopener noreferrer"><Share2 aria-hidden /> Enviar mi semana por WhatsApp</a></Button>
      <p className="text-xs text-muted-foreground">Incluye tus reservas y tus guardados de los próximos 7 días. El mensaje solo lleva títulos y horas.</p>
    </div>
  )
}
