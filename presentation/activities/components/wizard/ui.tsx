"use client"

import { useId, type ReactNode } from "react"
import { cn } from "@/app/lib/utils/cn"

/** Etiqueta + control + ayuda, con el id enlazado (accesible). */
export function Field({ label, hint, optional, children }: { label: string; hint?: string; optional?: boolean; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label} {optional ? <span className="font-normal text-muted-foreground">(opcional)</span> : null}
      </label>
      {children(id)}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Botón-píldora que alterna (días de la semana, "con quién"). */
export function ToggleChip({ pressed, onClick, children, className }: { pressed: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
        pressed ? "border-transparent bg-primary-dark text-white" : "border-border bg-card hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Opción grande de un grupo de radios (tarjeta). */
export function RadioCard({ name, checked, onChange, title, description }: { name: string; checked: boolean; onChange: () => void; title: string; description?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/30", checked ? "border-primary bg-primary-light" : "border-border bg-card hover:bg-muted/50")}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 size-5 accent-[#D42F3C]" />
      <span className="grid gap-0.5">
        <span className="font-semibold">{title}</span>
        {description ? <span className="text-sm text-muted-foreground">{description}</span> : null}
      </span>
    </label>
  )
}

export const selectClass = "h-11 w-full rounded-2xl border border-border bg-card px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
