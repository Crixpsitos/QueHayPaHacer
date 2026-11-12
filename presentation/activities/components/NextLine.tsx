"use client"

import { useEffect, useState } from "react"
import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { nextDepartureLabel } from "@/presentation/activities/lib/nextDeparture"

/** "Próxima: domingo 15 · 6:00 a. m." en la tarjeta. Se calcula en el navegador; antes se ve el horario escrito. */
export function NextLine({ schedule, scheduleText }: { schedule: ActivitySchedule; scheduleText: string }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => {
      const l = nextDepartureLabel(schedule, new Date())
      setText(l ? `${l.relative === "Hoy" || l.relative === "Mañana" ? `${l.relative} · ` : ""}${l.dateLabel.split(" de ")[0]}${l.timeLabel ? ` · ${l.timeLabel}` : ""}` : null)
    }, 0)
    return () => clearTimeout(t)
  }, [schedule])
  return <p className="text-sm font-medium">{text ? `Próxima: ${text}` : scheduleText}</p>
}
