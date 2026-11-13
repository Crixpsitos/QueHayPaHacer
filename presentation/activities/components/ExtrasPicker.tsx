"use client"

import { Minus, Plus } from "lucide-react"
import { cop } from "@/domain/entities/catalog/Product"
import { EXTRA_QTY_MAX, type ExtraPick } from "@/domain/entities/activities/reservationExtras"

type Offered = { label: string; amountCop: number }

/** Servicios aparte (almuerzo, agua…) con cantidad. Sin elegir nada = ninguno. */
export function ExtrasPicker({ offered, value, onChange }: { offered: readonly Offered[]; value: ExtraPick[]; onChange: (v: ExtraPick[]) => void }) {
  const qty = (label: string) => value.find((p) => p.label === label)?.qty ?? 0
  const set = (label: string, q: number) => {
    const n = Math.max(0, Math.min(EXTRA_QTY_MAX, q))
    onChange([...value.filter((p) => p.label !== label), ...(n ? [{ label, qty: n }] : [])])
  }
  return (
    <ul className="grid gap-2" aria-label="Servicios aparte">
      {offered.map((o) => {
        const q = qty(o.label)
        return (
          <li key={o.label} className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2">
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{o.label}</div>
              {o.amountCop > 0 ? <div className="text-xs text-muted-foreground">{cop(o.amountCop)} c/u</div> : null}
            </div>
            <button type="button" aria-label={`Quitar ${o.label}`} disabled={!q} onClick={() => set(o.label, q - 1)} className="flex size-11 items-center justify-center rounded-full border border-border disabled:opacity-40"><Minus className="size-4" aria-hidden /></button>
            <span className="w-6 text-center font-heading text-lg font-bold tabular-nums" aria-live="polite">{q}</span>
            <button type="button" aria-label={`Agregar ${o.label}`} onClick={() => set(o.label, q + 1)} className="flex size-11 items-center justify-center rounded-full border border-primary-dark bg-primary-light text-primary-dark"><Plus className="size-4" aria-hidden /></button>
          </li>
        )
      })}
    </ul>
  )
}
