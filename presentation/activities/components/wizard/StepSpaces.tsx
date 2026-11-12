"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { OFFERING_DESC_MAX, OFFERING_NAME_MAX, SPACES_MAX, SPACE_RULES_MAX } from "@/domain/entities/activities/value-objects/Offerings"
import { blankSpace, type FormSpace } from "@/presentation/activities/lib/activityForm"
import type { StepProps } from "./StepKind"
import { Field } from "./ui"

const UNITS = [["hora", "por hora"], ["dia", "por día"], ["persona", "por persona"], ["evento", "por evento"]] as const
const upd = <T,>(list: T[], i: number, patch: Partial<T>): T[] => list.map((x, j) => (j === i ? { ...x, ...patch } : x))

/** Espacios reservables del sitio (una sala, una mesa grande, un salón). La reserva se hace por el botón de acción del paso «Cómo se apuntan». */
export function StepSpaces({ form, patch }: StepProps) {
  if (form.kind !== "site") return null
  const s = form.spaces
  return (
    <div className="grid gap-8">
      <section className="grid gap-4" aria-labelledby="esp-t">
        <div className="grid gap-1"><h3 id="esp-t" className="font-heading text-lg font-bold">Espacios que se pueden reservar (opcional)</h3><p className="text-sm text-muted-foreground">Hasta {SPACES_MAX}: una sala, una mesa grande, un salón. La reserva se hace por tu botón de acción.</p></div>
        {s.map((x: FormSpace, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
            <Field label="Nombre del espacio">{(id) => <Input id={id} value={x.name} maxLength={OFFERING_NAME_MAX} onChange={(e) => patch({ spaces: upd(s, i, { name: e.target.value }) })} />}</Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Capacidad">{(id) => <Input id={id} inputMode="numeric" value={x.capacity} onChange={(e) => patch({ spaces: upd(s, i, { capacity: e.target.value }) })} />}</Field>
              <Field label="Precio (COP)">{(id) => <Input id={id} inputMode="numeric" value={x.price} placeholder="40.000" onChange={(e) => patch({ spaces: upd(s, i, { price: e.target.value }) })} />}</Field>
              <Field label="Se cobra">{(id) => <select id={id} value={x.unit} onChange={(e) => patch({ spaces: upd(s, i, { unit: e.target.value as FormSpace["unit"] }) })} className="h-11 rounded-2xl border border-transparent bg-input/50 px-3 text-base">{UNITS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
            </div>
            <Field label="Descripción" optional>{(id) => <Textarea id={id} rows={2} value={x.description} maxLength={OFFERING_DESC_MAX} onChange={(e) => patch({ spaces: upd(s, i, { description: e.target.value }) })} />}</Field>
            <Field label="Reglas del espacio" optional>{(id) => <Textarea id={id} rows={2} value={x.rules} maxLength={SPACE_RULES_MAX} onChange={(e) => patch({ spaces: upd(s, i, { rules: e.target.value }) })} />}</Field>
            <Button type="button" variant="ghost" className="h-11 w-fit" onClick={() => patch({ spaces: s.filter((_, j) => j !== i) })}><Trash2 aria-hidden /> Quitar espacio</Button>
          </div>
        ))}
        {s.length < SPACES_MAX ? <Button type="button" variant="outline" size="lg" className="h-12 w-fit" onClick={() => patch({ spaces: [...s, blankSpace()] })}><Plus aria-hidden /> Agregar espacio</Button> : null}
      </section>

    </div>
  )
}
