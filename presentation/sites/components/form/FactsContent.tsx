"use client"

import { useId } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { moveItem, removeItem, updateItem } from "@/domain/entities/sites/value-objects/listOps"
import {
  addFact, FACTS_MAX, FACT_ICON_OPTIONS, FACT_LABEL_MAX, FACT_VALUE_MAX, type FactIconId, type SiteFact,
} from "@/domain/entities/sites/value-objects/SiteFacts"

const iconBtn = "size-11 shrink-0"

/** Hasta 6 datos rápidos (entrada, duración, dificultad…) que se ven arriba de la descripción. Opcional. */
export function FactsContent({ value, onChange }: { value: SiteFact[]; onChange: (v: SiteFact[]) => void }) {
  const uid = useId()
  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">
        Opcional. Datos cortos que se leen de un vistazo, como &ldquo;Entrada $20.000&rdquo;, &ldquo;60 min&rdquo; o &ldquo;Exigente&rdquo;. Máximo {FACTS_MAX}.
      </p>

      {value.map((f, i) => (
        <fieldset key={i} className="grid gap-2 rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">Dato {i + 1}</legend>
          <div className="grid gap-1">
            <label htmlFor={`${uid}-i${i}`} className="text-xs font-medium">Icono</label>
            <select
              id={`${uid}-i${i}`}
              value={f.icon}
              onChange={(e) => onChange(updateItem(value, i, { icon: e.target.value as FactIconId }))}
              className="min-h-11 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
            >
              {FACT_ICON_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <label htmlFor={`${uid}-l${i}`} className="text-xs font-medium">Etiqueta</label>
              <Input id={`${uid}-l${i}`} value={f.label} maxLength={FACT_LABEL_MAX} placeholder="Ej: Entrada"
                onChange={(e) => onChange(updateItem(value, i, { label: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <label htmlFor={`${uid}-v${i}`} className="text-xs font-medium">Dato</label>
              <Input id={`${uid}-v${i}`} value={f.value} maxLength={FACT_VALUE_MAX} placeholder="Ej: $20.000"
                onChange={(e) => onChange(updateItem(value, i, { value: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="icon" className={iconBtn} disabled={i === 0}
              aria-label={`Subir el dato ${f.label || i + 1}`} onClick={() => onChange(moveItem(value, i, -1))}>
              <ArrowUp className="size-4" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={iconBtn} disabled={i === value.length - 1}
              aria-label={`Bajar el dato ${f.label || i + 1}`} onClick={() => onChange(moveItem(value, i, 1))}>
              <ArrowDown className="size-4" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={iconBtn}
              aria-label={`Quitar el dato ${f.label || i + 1}`} onClick={() => onChange(removeItem(value, i))}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" className="min-h-11" disabled={value.length >= FACTS_MAX} onClick={() => onChange(addFact(value))}>
          <Plus className="mr-1.5 size-4" aria-hidden /> Agregar dato
        </Button>
        <p className="text-[11px] tabular-nums text-muted-foreground" aria-live="polite">{value.length}/{FACTS_MAX} datos</p>
      </div>
    </div>
  )
}
