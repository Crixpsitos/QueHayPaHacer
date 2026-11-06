import { Car, Clock, Info, Mountain, PawPrint, Route, Ticket, Timer, Users, Utensils, type LucideIcon } from "lucide-react"
import type { FactIconId, SiteFact } from "@/domain/entities/sites/value-objects/SiteFacts"

export const FACT_ICONS: Record<FactIconId, LucideIcon> = {
  price: Ticket, time: Timer, schedule: Clock, distance: Route, level: Mountain,
  people: Users, parking: Car, pets: PawPrint, food: Utensils, other: Info,
}

/** Datos rápidos arriba de la descripción: se leen de un vistazo. Sin cajas, solo icono + dato. */
export function FactsRow({ facts }: { facts: SiteFact[] }) {
  if (facts.length === 0) return null
  return (
    <ul aria-label="Datos rápidos" className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {facts.map((f, i) => {
        const Icon = FACT_ICONS[f.icon] ?? Info
        return (
          <li key={i} className="flex min-w-0 items-start gap-2.5">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{f.label}</p>
              <p className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{f.value}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
