"use client"

import { useId } from "react"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/app/lib/utils/cn"
import { TRANSIT_MAX_ROUTES, TRANSIT_NOTE_MAX, type SiteTransitDraft } from "@/domain/entities/sites/value-objects/SiteTransit"
import { useTransitRoutes } from "../../hooks/useTransitRoutes"

/**
 * "Cómo llegar en bus": el autor marca rutas del catálogo (no hay texto libre de rutas) y, si quiere, una nota por
 * ruta ("Bájate en la Cl 60 con Cra 5"). El servidor vuelve a validar contra el catálogo vigente.
 */
export function TransitContent({ transit, onChange }: { transit: SiteTransitDraft; onChange: (v: SiteTransitDraft) => void }) {
  const uid = useId() // el formulario se monta dos veces (escritorio + drawer móvil)
  const catalog = useTransitRoutes()
  const selected = new Map(transit.routes.map((r) => [r.id, r]))
  const full = transit.routes.length >= TRANSIT_MAX_ROUTES

  const toggle = (id: string) =>
    onChange({ routes: selected.has(id) ? transit.routes.filter((r) => r.id !== id) : [...transit.routes, { id }] })
  const setNote = (id: string, note: string) =>
    onChange({ routes: transit.routes.map((r) => (r.id === id ? { ...r, note } : r)) })

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Opcional. Marca solo las rutas que sepas que pasan cerca. Se muestran como “Informado por el dueño”.
      </p>

      {catalog === null && <p className="text-xs text-muted-foreground">Cargando rutas…</p>}
      {catalog?.length === 0 && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Aún no hay rutas cargadas.</p>
      )}

      {!!catalog?.length && (
        <>
          <div role="group" aria-label="Rutas de bus" className="flex flex-wrap gap-2">
            {catalog.map((r) => {
              const on = selected.has(r.id)
              const disabled = !on && full
              return (
                // Botón (no un <input class="sr-only"> dentro de un <label>): al enfocar un input escondido el
                // navegador desplazaba un contenedor exterior de la hoja móvil y todo el formulario quedaba en blanco.
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  disabled={disabled}
                  onClick={() => toggle(r.id)}
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    on ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
          {full && <p className="text-xs text-muted-foreground">Máximo {TRANSIT_MAX_ROUTES} rutas.</p>}

          {transit.routes.map((r) => {
            const label = catalog.find((c) => c.id === r.id)?.label
            if (!label) return null // ruta que ya no está en el catálogo: el servidor la descarta al guardar
            const note = r.note ?? ""
            return (
              <div key={r.id} className="flex min-w-0 flex-col gap-1">
                <label className="text-xs font-medium text-foreground" htmlFor={`${uid}-${r.id}`}>
                  {label}: dónde bajarse <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <Input
                  id={`${uid}-${r.id}`}
                  value={note}
                  maxLength={TRANSIT_NOTE_MAX}
                  onChange={(e) => setNote(r.id, e.target.value)}
                  placeholder="Bájate en la Cl 60 con Cra 5"
                  className="h-11 rounded-lg text-base"
                />
                <span className="self-end text-[11px] tabular-nums text-muted-foreground">{note.length}/{TRANSIT_NOTE_MAX}</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
