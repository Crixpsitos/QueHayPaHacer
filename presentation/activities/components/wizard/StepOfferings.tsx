"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { OFFERINGS_MAX, OFFERING_DESC_MAX, OFFERING_NAME_MAX, PRICES_DISCLAIMER, SPACES_MAX, SPACE_RULES_MAX } from "@/domain/entities/activities/value-objects/Offerings"
import { PROMOTIONS_MAX, PROMO_DESC_MAX, PROMO_TERMS_MAX, PROMO_TITLE_MAX } from "@/domain/entities/activities/value-objects/Promotion"
import { blankOffering, blankPromotion, blankSpace, toggleWeekday, type FormOffering, type FormPromotion, type FormSpace } from "@/presentation/activities/lib/activityForm"
import type { StepProps } from "./StepKind"
import { Field, ToggleChip } from "./ui"

const UNITS = [["hora", "por hora"], ["dia", "por día"], ["persona", "por persona"], ["evento", "por evento"]] as const
const upd = <T,>(list: T[], i: number, patch: Partial<T>): T[] => list.map((x, j) => (j === i ? { ...x, ...patch } : x))

/** Menú/productos y espacios reservables del sitio. El botón de comprar o reservar es el de acción del paso «Cómo se apuntan». */
export function StepOfferings({ form, patch }: StepProps) {
  if (form.kind !== "site") return null
  const o = form.offerings, s = form.spaces, pr = form.promotions
  return (
    <div className="grid gap-8">
      <section className="grid gap-4" aria-labelledby="menu-t">
        <div className="grid gap-1"><h3 id="menu-t" className="font-heading text-lg font-bold">Menú o productos (opcional)</h3><p className="text-sm text-muted-foreground">Hasta {OFFERINGS_MAX}. Se muestran en la actividad con su precio. No hay carrito: se compra por tu botón de acción. {PRICES_DISCLAIMER}</p></div>
        {o.map((x: FormOffering, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
              <Field label="Producto">{(id) => <Input id={id} value={x.name} maxLength={OFFERING_NAME_MAX} onChange={(e) => patch({ offerings: upd(o, i, { name: e.target.value }) })} />}</Field>
              <Field label="Precio (COP)">{(id) => <Input id={id} inputMode="numeric" value={x.price} placeholder="6.000" onChange={(e) => patch({ offerings: upd(o, i, { price: e.target.value }) })} />}</Field>
            </div>
            <Field label="Descripción" optional>{(id) => <Textarea id={id} rows={2} value={x.description} maxLength={OFFERING_DESC_MAX} onChange={(e) => patch({ offerings: upd(o, i, { description: e.target.value }) })} />}</Field>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Sección del menú" optional hint="Por ejemplo: Helados, Bebidas.">{(id) => <Input id={id} value={x.group} maxLength={40} onChange={(e) => patch({ offerings: upd(o, i, { group: e.target.value }) })} />}</Field>
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[#9B0A26]" checked={x.available} onChange={(e) => patch({ offerings: upd(o, i, { available: e.target.checked }) })} />Disponible hoy</label>
            </div>
            <Button type="button" variant="ghost" className="h-11 w-fit" onClick={() => patch({ offerings: o.filter((_, j) => j !== i) })}><Trash2 aria-hidden /> Quitar producto</Button>
          </div>
        ))}
        {o.length < OFFERINGS_MAX ? <Button type="button" variant="outline" size="lg" className="h-12 w-fit" onClick={() => patch({ offerings: [...o, blankOffering()] })}><Plus aria-hidden /> Agregar producto</Button> : null}
      </section>

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

      <section className="grid gap-4" aria-labelledby="promo-t">
        <div className="grid gap-1"><h3 id="promo-t" className="font-heading text-lg font-bold">Promociones (opcional)</h3><p className="text-sm text-muted-foreground">Hasta {PROMOTIONS_MAX}, como «Tardes felices» o «Black Sunday». Toda promoción tiene fecha final: cuando pasa, desaparece sola.</p></div>
        {pr.map((x: FormPromotion, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
            <Field label="Nombre de la promoción">{(id) => <Input id={id} value={x.title} maxLength={PROMO_TITLE_MAX} onChange={(e) => patch({ promotions: upd(pr, i, { title: e.target.value }) })} />}</Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo">{(id) => <select id={id} value={x.ruleKind} onChange={(e) => patch({ promotions: upd(pr, i, { ruleKind: e.target.value as FormPromotion["ruleKind"] }) })} className="h-11 rounded-2xl border border-transparent bg-input/50 px-3 text-base"><option value="twoForOne">2x1</option><option value="percent">Descuento en %</option><option value="freeItem">Producto gratis</option><option value="fixedPrice">Precio especial</option><option value="other">Otra</option></select>}</Field>
              {x.ruleKind === "percent" || x.ruleKind === "fixedPrice" ? <Field label={x.ruleKind === "percent" ? "Porcentaje" : "Precio (COP)"}>{(id) => <Input id={id} inputMode="numeric" value={x.ruleValue} onChange={(e) => patch({ promotions: upd(pr, i, { ruleValue: e.target.value }) })} />}</Field> : null}
            </div>
            <Field label="Descripción" optional>{(id) => <Textarea id={id} rows={2} value={x.description} maxLength={PROMO_DESC_MAX} onChange={(e) => patch({ promotions: upd(pr, i, { description: e.target.value }) })} />}</Field>
            <div className="grid gap-1.5"><span className="text-sm font-semibold">Días <span className="font-normal text-muted-foreground">(sin marcar = todos)</span></span><div className="flex flex-wrap gap-2">{[["D", 0], ["L", 1], ["M", 2], ["X", 3], ["J", 4], ["V", 5], ["S", 6]].map(([l, d]) => <ToggleChip key={d} pressed={x.weekdays.includes(d as number)} onClick={() => patch({ promotions: upd(pr, i, { weekdays: toggleWeekday(x.weekdays, d as number) }) })} className="min-w-11 px-0">{l}</ToggleChip>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Desde las" optional>{(id) => <Input id={id} type="time" value={x.start} onChange={(e) => patch({ promotions: upd(pr, i, { start: e.target.value }) })} />}</Field>
              <Field label="Hasta las" optional>{(id) => <Input id={id} type="time" value={x.end} onChange={(e) => patch({ promotions: upd(pr, i, { end: e.target.value }) })} />}</Field>
              <Field label="Vale desde">{(id) => <Input id={id} type="date" value={x.validFrom} onChange={(e) => patch({ promotions: upd(pr, i, { validFrom: e.target.value }) })} />}</Field>
              <Field label="Vale hasta (obligatorio)">{(id) => <Input id={id} type="date" value={x.validUntil} onChange={(e) => patch({ promotions: upd(pr, i, { validUntil: e.target.value }) })} />}</Field>
            </div>
            <Field label="Condiciones" optional hint="Por ejemplo: hasta agotar existencias.">{(id) => <Input id={id} value={x.termsNote} maxLength={PROMO_TERMS_MAX} onChange={(e) => patch({ promotions: upd(pr, i, { termsNote: e.target.value }) })} />}</Field>
            <div className="flex flex-wrap gap-2">
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[#9B0A26]" checked={x.paused} onChange={(e) => patch({ promotions: upd(pr, i, { paused: e.target.checked }) })} />Pausada</label>
              <Button type="button" variant="ghost" className="h-11" onClick={() => patch({ promotions: pr.filter((_, j) => j !== i) })}><Trash2 aria-hidden /> Quitar promoción</Button>
            </div>
          </div>
        ))}
        {pr.length < PROMOTIONS_MAX ? <Button type="button" variant="outline" size="lg" className="h-12 w-fit" onClick={() => patch({ promotions: [...pr, blankPromotion()] })}><Plus aria-hidden /> Agregar promoción</Button> : null}
      </section>
    </div>
  )
}
