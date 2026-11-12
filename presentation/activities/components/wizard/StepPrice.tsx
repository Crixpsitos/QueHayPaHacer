"use client"

import { useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { EXTRA_UNITS, INCLUDES_MAX, INCLUDE_ITEM_MAX, PRICE_LABEL_MAX, PRICE_UNITS, formatCop, type ExtraUnit, type PriceUnit } from "@/domain/entities/activities/value-objects/Price"
import { addExtra, addInclude, addPrice, parseMoney, removeExtra, removeInclude, removePrice, updateExtra, updatePrice } from "@/presentation/activities/lib/activityForm"
import { Field, selectClass } from "./ui"
import type { StepProps } from "./StepKind"

const UNIT_LABEL: Record<string, string> = { persona: "persona", grupo: "grupo", hora: "hora", unidad: "unidad", consultar: "a consultar (sin valor)" }
const moneyInput = (v: string) => v.replace(/[^\d.]/g, "").slice(0, 12)

function IncludesEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("")
  const add = () => {
    onChange(addInclude(value, draft))
    setDraft("")
  }
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">¿Qué incluye? <span className="font-normal text-muted-foreground">(hasta {INCLUDES_MAX})</span></div>
      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((x, i) => (
            <li key={x} className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-sm">
              {x}
              <button type="button" aria-label={`Quitar ${x}`} className="grid size-8 place-items-center rounded-full hover:bg-border" onClick={() => onChange(removeInclude(value, i))}><X className="size-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      ) : null}
      {value.length < INCLUDES_MAX ? (
        <div className="flex gap-2">
          <Input value={draft} maxLength={INCLUDE_ITEM_MAX} placeholder="Ej: Almuerzo" aria-label="Agregar algo que incluye" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }} />
          <Button type="button" variant="outline" size="lg" className="h-11" onClick={add} disabled={!draft.trim()}>Agregar</Button>
        </div>
      ) : null}
    </div>
  )
}

/** Paso 4: opciones de precio (con lo que incluye) y extras que se pagan aparte. Pesos colombianos. */
export function StepPrice({ form, patch }: StepProps) {
  const prices = form.priceOptions
  const lowest = Math.min(...prices.map((p) => parseMoney(p.amount)).filter((n) => Number.isFinite(n)))
  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        {prices.map((p, i) => (
          <fieldset key={i} className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            <legend className="px-1 text-xs font-semibold tracking-wide text-muted-foreground">OPCIÓN {i + 1}</legend>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1"><Field label="Nombre">{(id) => <Input id={id} value={p.label} maxLength={PRICE_LABEL_MAX} placeholder="Ej: Salida completa" onChange={(e) => patch({ priceOptions: updatePrice(prices, i, { label: e.target.value }) })} />}</Field></div>
              {prices.length > 1 ? <Button type="button" variant="ghost" size="icon-lg" aria-label={`Quitar la opción ${i + 1}`} onClick={() => patch({ priceOptions: removePrice(prices, i) })}><Trash2 aria-hidden /></Button> : null}
            </div>
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              <Field label="Precio (COP)" hint="0 si es gratis.">{(id) => <Input id={id} inputMode="numeric" value={p.amount} placeholder="40.000" onChange={(e) => patch({ priceOptions: updatePrice(prices, i, { amount: moneyInput(e.target.value) }) })} />}</Field>
              <Field label="Por">{(id) => <select id={id} className={selectClass} value={p.unit} onChange={(e) => patch({ priceOptions: updatePrice(prices, i, e.target.value === "consultar" ? { unit: "consultar", amount: "0" } : { unit: e.target.value as PriceUnit }) })}>{PRICE_UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}</select>}</Field>
            </div>
            <IncludesEditor value={p.includes} onChange={(includes) => patch({ priceOptions: updatePrice(prices, i, { includes }) })} />
          </fieldset>
        ))}
        <Button type="button" variant="outline" size="lg" className="h-12 border-dashed" onClick={() => patch({ priceOptions: addPrice(prices) })}><Plus aria-hidden /> Agregar otra opción</Button>
      </div>

      <div className="grid gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Extras <span className="text-sm font-normal text-muted-foreground">(opcional)</span></h2>
          <p className="text-sm text-muted-foreground">Servicios que se pagan aparte, como &quot;con agua&quot;.</p>
        </div>
        {form.extras.map((x, i) => (
          <fieldset key={i} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
            <legend className="px-1 text-xs font-semibold tracking-wide text-muted-foreground">EXTRA {i + 1}</legend>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1"><Field label="Nombre">{(id) => <Input id={id} value={x.label} maxLength={PRICE_LABEL_MAX} placeholder="Ej: Con agua" onChange={(e) => patch({ extras: updateExtra(form.extras, i, { label: e.target.value }) })} />}</Field></div>
              <Button type="button" variant="ghost" size="icon-lg" aria-label={`Quitar el extra ${i + 1}`} onClick={() => patch({ extras: removeExtra(form.extras, i) })}><Trash2 aria-hidden /></Button>
            </div>
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              <Field label="Precio (COP)">{(id) => <Input id={id} inputMode="numeric" value={x.amount} placeholder="3.000" onChange={(e) => patch({ extras: updateExtra(form.extras, i, { amount: moneyInput(e.target.value) }) })} />}</Field>
              <Field label="Por">{(id) => <select id={id} className={selectClass} value={x.unit} onChange={(e) => patch({ extras: updateExtra(form.extras, i, { unit: e.target.value as ExtraUnit }) })}>{EXTRA_UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}</select>}</Field>
            </div>
          </fieldset>
        ))}
        <Button type="button" variant="outline" size="lg" className="h-12 border-dashed" onClick={() => patch({ extras: addExtra(form.extras) })}><Plus aria-hidden /> Agregar extra</Button>
      </div>

      {Number.isFinite(lowest) ? (
        <div className="rounded-2xl border border-[#F6DDA0] bg-accent p-4" aria-live="polite">
          <div className="text-xs font-semibold tracking-wide text-[#7a5200]">ASÍ SE VERÁ EN LAS TARJETAS</div>
          <p className="text-base">{lowest === 0 ? <strong>Gratis</strong> : <>Desde <strong>{formatCop(lowest)}</strong></>} · el precio más bajo de tus opciones</p>
        </div>
      ) : null}
    </div>
  )
}
