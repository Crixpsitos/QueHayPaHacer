"use client"

import { useEffect, useState } from "react"
import { CalendarDays } from "lucide-react"
import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { nextDepartureLabel, type NextDepartureLabel } from "@/presentation/activities/lib/nextDeparture"

/**
 * "Próxima salida". El HTML de la ficha se cachea por horas, así que la fecha se calcula en el navegador con la hora
 * de hoy; mientras tanto (y para buscadores) se muestra el horario escrito ("Todos los domingos · 6:00 a. m.").
 */
export function NextDeparture({ schedule, scheduleText, requiresReservation }: { schedule: ActivitySchedule; scheduleText: string; requiresReservation: boolean }) {
  const [label, setLabel] = useState<NextDepartureLabel | null | undefined>(undefined)
  useEffect(() => {
    // En un callback para no re-renderizar en cascada desde el cuerpo del efecto.
    const t = setTimeout(() => setLabel(nextDepartureLabel(schedule, new Date())), 0)
    return () => clearTimeout(t)
  }, [schedule])

  return (
    <section aria-label="Próxima salida" className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground">PRÓXIMA SALIDA</span>
        {label ? <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-[#7a5200]">{label.relative}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="grid size-13 shrink-0 place-items-center rounded-2xl bg-primary-light text-primary-dark"><CalendarDays className="size-6" aria-hidden /></div>
        <div className="min-w-0">
          {label ? (
            <>
              <div className="font-heading text-xl font-semibold leading-tight">{label.dateLabel}</div>
              <div className="text-sm text-muted-foreground">{[label.timeLabel, scheduleText.split(" · ")[0].toLowerCase()].filter(Boolean).join(" · ")}</div>
            </>
          ) : (
            <div className="font-heading text-xl font-semibold leading-tight">{scheduleText}</div>
          )}
        </div>
      </div>
      {requiresReservation ? <p className="text-sm text-muted-foreground">Hay que reservar antes.</p> : null}
    </section>
  )
}
