"use client"

import { useEffect, useState } from "react"
import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { bogotaDateIso, occurrencesBetween } from "@/domain/entities/activities/value-objects/occurrences"

interface Slot { date: string; hhmm: string | null }
const WD = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MONTH = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const hourText = (hhmm: string) => { const h = Number(hhmm.slice(0, 2)); return `${h % 12 === 0 ? 12 : h % 12}:${hhmm.slice(3)} ${h < 12 ? "a. m." : "p. m."}` }

/** «Próximas salidas»: las próximas fechas reales de la actividad. Se calcula en el navegador (la ficha se cachea por horas). */
export function UpcomingDates({ schedule }: { schedule: ActivitySchedule }) {
  const [slots, setSlots] = useState<Slot[] | null>(null)
  useEffect(() => {
    const t = setTimeout(() => {
      const now = new Date(), today = bogotaDateIso(now)
      const out: Slot[] = []
      for (const o of occurrencesBetween(schedule, today, addDays(today, 60))) {
        if (o.endsAt ? o.endsAt < now : o.startsAt ? o.startsAt.getTime() + 3_600_000 < now.getTime() : false) continue
        out.push({ date: o.date, hhmm: o.startsAt ? new Date(o.startsAt.getTime() - 5 * 3_600_000).toISOString().slice(11, 16) : null })
        if (out.length >= 6) break
      }
      setSlots(out)
    }, 0)
    return () => clearTimeout(t)
  }, [schedule])

  if (!slots?.length || (slots.length === 1 && slots[0].hhmm === null && schedule.rules.every((r) => r.kind === "always"))) return null
  return (
    <section aria-labelledby="salidas" className="grid gap-3">
      <h2 id="salidas" className="font-heading text-2xl font-extrabold tracking-tight">Próximas salidas</h2>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {slots.map((s, i) => {
          const d = new Date(`${s.date}T12:00:00Z`)
          return (
            <li key={`${s.date}-${s.hhmm}`} className={`flex w-24 shrink-0 flex-col items-center gap-0.5 rounded-2xl border-[1.5px] px-2 py-3 text-center ${i === 0 ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card"}`}>
              <span className={`text-xs font-medium ${i === 0 ? "text-white/80" : "text-muted-foreground"}`}>{i === 0 && s.date === bogotaDateIso(new Date()) ? "Hoy" : WD[d.getUTCDay()]}</span>
              <span className="font-heading text-2xl font-bold leading-none">{d.getUTCDate()}</span>
              <span className={`text-xs ${i === 0 ? "text-white/80" : "text-muted-foreground"}`}>{MONTH[d.getUTCMonth()]}</span>
              <span className="mt-1 text-xs font-semibold">{s.hhmm ? hourText(s.hhmm) : "Todo el día"}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
