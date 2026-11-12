import { Users } from "lucide-react"
import type { ActivityPublicView } from "@/presentation/activities/lib/publicView"

/** Espacios que se pueden reservar. La reserva se hace por el botón de acción de la actividad (no hay pago en QHPA). */
export function SpacesList({ items }: { items: ActivityPublicView["spaces"] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="espacios" className="grid gap-4">
      <h2 id="espacios" className="font-heading text-2xl font-extrabold tracking-tight">Espacios para reservar</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((x) => (
          <li key={x.name} className="grid content-start gap-2 rounded-3xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3"><h3 className="font-heading text-lg font-bold leading-snug">{x.name}</h3><span className="shrink-0 text-right"><span className="font-heading text-xl font-extrabold">{x.priceCop === 0 ? "Gratis" : x.price}</span>{x.priceCop === 0 ? null : <span className="block text-xs text-muted-foreground">por {x.unit}</span>}</span></div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-primary-dark"><Users className="size-4" aria-hidden />Hasta {x.capacity} personas</p>
            {x.description ? <p className="text-sm leading-relaxed">{x.description}</p> : null}
            {x.rules ? <p className="rounded-2xl bg-muted/70 p-3 text-sm text-muted-foreground"><strong className="text-foreground">Reglas: </strong>{x.rules}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
