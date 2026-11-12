import { Info } from "lucide-react"
import { PRICES_DISCLAIMER } from "@/domain/entities/activities/value-objects/Offerings"
import type { ActivityPublicView } from "@/presentation/activities/lib/publicView"

/** Menú o productos del sitio, agrupados por sección. Precios informativos: no hay carrito; el botón de la actividad es la vía de compra. */
export function OfferingsList({ items }: { items: ActivityPublicView["offerings"] }) {
  if (!items.length) return null
  const groups = [...items.reduce((m, x) => m.set(x.group, [...(m.get(x.group) ?? []), x]), new Map<string, typeof items>())]
  return (
    <section aria-labelledby="menu" className="grid gap-4">
      <h2 id="menu" className="font-heading text-2xl font-extrabold tracking-tight">Menú y productos</h2>
      <div className="grid gap-5">
        {groups.map(([group, list]) => (
          <div key={group || "_"} className="grid gap-2">
            {group ? <h3 className="font-heading text-lg font-bold text-primary-dark">{group}</h3> : null}
            <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
              {list.map((x) => (
                <li key={x.name} className="flex items-start gap-4 px-4 py-3.5">
                  <span className="grid min-w-0 flex-1 gap-0.5 leading-snug"><span className="font-semibold">{x.name}</span>{x.description ? <span className="text-sm text-muted-foreground">{x.description}</span> : null}</span>
                  <span className="shrink-0 font-heading text-lg font-bold">{x.priceCop === 0 ? "Gratis" : x.price}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Info className="size-4 shrink-0" aria-hidden />{PRICES_DISCLAIMER}</p>
    </section>
  )
}
