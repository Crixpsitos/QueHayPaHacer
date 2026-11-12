"use client"

import { Star } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"

/** Estrellas de solo lectura: el valor se dice con texto, no solo con color. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={`${value} de 5 estrellas`} className={cn("inline-flex gap-0.5 text-[#FFB703]", className)}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("size-4", n <= value ? "fill-current" : "fill-transparent text-[#E4E4E7]")} aria-hidden />)}
    </span>
  )
}

/** Elegir de 1 a 5: grupo de radios con teclado (flechas) como cualquier radiogroup. */
export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Tu calificación" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`} tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
          onClick={() => onChange(n)}
          onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, (value || 0) + 1)) } if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, (value || 2) - 1)) } }}
          className="grid size-11 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
          <Star className={cn("size-8", n <= value ? "fill-[#FFB703] text-[#FFB703]" : "fill-transparent text-[#D4D4D8]")} aria-hidden />
        </button>
      ))}
    </div>
  )
}
