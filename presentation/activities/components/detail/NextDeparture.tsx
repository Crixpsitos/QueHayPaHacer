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

  // "domingo 15 de noviembre" → día, mes y día de la semana para el talón del boleto
  const m = label?.dateLabel.match(/^(\S+)\s+(\d{1,2})\s+de\s+(\S+)/)
  const weekday = m?.[1]
  const day = m?.[2]
  const month = m?.[3]?.slice(0, 3)
  return (
    <section aria-label="Próxima salida" className="relative grid grid-cols-[6.25rem_1fr] overflow-hidden rounded-3xl bg-foreground text-background shadow-card">
      {/* talón del boleto: número grande en dorado */}
      <div className="grid place-items-center border-r border-dashed border-background/25 px-3 py-5 text-center">
        {day ? (
          <div className="grid leading-none">
            <span className="text-sm font-medium text-background/70">{month}</span>
            <span className="font-heading text-5xl font-extrabold tracking-tight text-[#FFB703]">{day}</span>
          </div>
        ) : (
          <CalendarDays className="size-9 text-[#FFB703]" aria-hidden />
        )}
      </div>
      <div className="grid content-center gap-1.5 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.8125rem] font-medium text-background/70">Próxima salida</span>
          {label ? <span className="rounded-full bg-[#FFB703] px-2.5 py-0.5 text-xs font-bold text-foreground">{label.relative}</span> : null}
        </div>
        {label ? (
          <>
            <div className="font-heading text-2xl font-bold leading-tight">{weekday}{label.timeLabel ? ` · ${label.timeLabel}` : ""}</div>
            <div className="text-sm text-background/75">{scheduleText.split(" · ")[0]}</div>
          </>
        ) : (
          <div className="font-heading text-xl font-bold leading-tight">{scheduleText}</div>
        )}
        {requiresReservation ? <p className="text-sm font-medium text-[#FFB703]">Hay que reservar antes.</p> : null}
      </div>
      {/* muescas del boleto */}
      <span className="absolute left-[calc(6.25rem-0.75rem)] top-[-0.75rem] size-6 rounded-full bg-background" aria-hidden />
      <span className="absolute bottom-[-0.75rem] left-[calc(6.25rem-0.75rem)] size-6 rounded-full bg-background" aria-hidden />
    </section>
  )
}
