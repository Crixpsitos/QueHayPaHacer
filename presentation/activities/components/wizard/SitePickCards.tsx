"use client"

import { Check, MapPin, Store } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"
import { CATEGORY_OPTIONS } from "@/presentation/sites/lib/constants"
import type { WizardContext } from "@/app/actions/activities/wizard-data.action"

/**
 * «¿En cuál sitio?» como tarjetas: portada, nombre, categoría y dirección de cada sitio propio, para reconocerlo de un vistazo
 * (antes era una lista con solo nombres). Un grupo de radios: se elige uno, se puede quitar la elección con otro toque.
 */
export function SitePickCards({ sites, value, onChange }: { sites: WizardContext["sites"]; value: string | null; onChange: (id: string | null) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold">¿En cuál sitio?</legend>
      <p className="text-xs text-muted-foreground">Solo aparecen tus sitios publicados y aprobados. {sites.length === 1 ? "Tienes uno." : `Tienes ${sites.length}.`}</p>
      <div role="radiogroup" aria-label="Sitio de la actividad" className="grid gap-2.5 sm:grid-cols-2">
        {sites.map((s) => {
          const on = value === s.id
          const cat = CATEGORY_OPTIONS.find((o) => o.value === s.category)?.label
          return (
            <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(on ? null : s.id)}
              className={cn("group flex items-center gap-3 rounded-2xl border p-2.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40", on ? "border-primary-dark bg-primary-light" : "border-border bg-card hover:bg-muted/60")}>
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#FFB703] to-primary">
                {s.coverUrl ? <img src={s.coverUrl} alt="" loading="lazy" className="size-full object-cover" /> : <Store className="absolute inset-0 m-auto size-6 text-white" aria-hidden />}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-heading text-[0.9375rem] font-semibold">{s.name}</span>
                {cat ? <span className="w-fit rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-primary-dark">{cat}</span> : null}
                {s.address ? <span className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-3 shrink-0" aria-hidden />{s.address}</span> : null}
              </span>
              <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-full border-[1.5px]", on ? "border-primary-dark bg-primary-dark text-white" : "border-border")}>{on ? <Check className="size-3.5" /> : null}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
