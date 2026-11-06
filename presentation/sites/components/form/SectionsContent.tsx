"use client"

import { useId } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import {
  addSection, moveSection, removeSection, updateSection,
  SECTIONS_MAX, SECTIONS_TOTAL_MAX, SECTION_BODY_MAX, SECTION_TITLE_MAX, type SiteSection,
} from "@/domain/entities/sites/value-objects/SiteSections"

const iconBtn = "size-11 shrink-0"

/** Secciones que se abren y cierran en la ficha (cómo llegar, qué incluye, fuentes…). Opcional. */
export function SectionsContent({ value, onChange }: { value: SiteSection[]; onChange: (v: SiteSection[]) => void }) {
  const uid = useId()
  const total = value.reduce((n, s) => n + s.title.length + s.body.length, 0)
  const atLimit = value.length >= SECTIONS_MAX

  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">
        Opcional. Pon aquí los datos de consulta (cómo llegar, qué incluye, qué llevar, precios, fuentes) para que la descripción quede corta.
        En la ficha se muestran cerradas y se abren con un toque.
      </p>

      {value.map((s, i) => (
        <fieldset key={i} className="grid gap-2 rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">Sección {i + 1}</legend>
          <div className="flex items-end gap-1">
            <div className="grid min-w-0 flex-1 gap-1">
              <label htmlFor={`${uid}-t${i}`} className="text-xs font-medium">Título</label>
              <Input
                id={`${uid}-t${i}`}
                value={s.title}
                maxLength={SECTION_TITLE_MAX}
                placeholder="Ej: Cómo llegar"
                onChange={(e) => onChange(updateSection(value, i, { title: e.target.value }))}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className={iconBtn} disabled={i === 0}
              aria-label={`Subir la sección ${s.title || i + 1}`} onClick={() => onChange(moveSection(value, i, -1))}>
              <ArrowUp className="size-4" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={iconBtn} disabled={i === value.length - 1}
              aria-label={`Bajar la sección ${s.title || i + 1}`} onClick={() => onChange(moveSection(value, i, 1))}>
              <ArrowDown className="size-4" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={iconBtn}
              aria-label={`Quitar la sección ${s.title || i + 1}`} onClick={() => onChange(removeSection(value, i))}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
          <div className="grid gap-1">
            <label htmlFor={`${uid}-b${i}`} className="text-xs font-medium">Texto</label>
            <Textarea
              id={`${uid}-b${i}`}
              value={s.body}
              maxLength={SECTION_BODY_MAX}
              rows={5}
              placeholder="Escribe en texto plano. Los saltos de línea se respetan."
              onChange={(e) => onChange(updateSection(value, i, { body: e.target.value }))}
            />
            <p className="text-right text-[11px] tabular-nums text-muted-foreground">{s.body.length}/{SECTION_BODY_MAX}</p>
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" className="min-h-11" disabled={atLimit} onClick={() => onChange(addSection(value))}>
          <Plus className="mr-1.5 size-4" aria-hidden /> Agregar sección
        </Button>
        <p className={`text-[11px] tabular-nums ${total > SECTIONS_TOTAL_MAX ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
          {value.length}/{SECTIONS_MAX} secciones · {total}/{SECTIONS_TOTAL_MAX} caracteres
        </p>
      </div>
      {total > SECTIONS_TOTAL_MAX && (
        <p role="alert" className="text-xs text-destructive">
          Las secciones suman demasiado texto. Recorta hasta {SECTIONS_TOTAL_MAX} caracteres para poder guardar.
        </p>
      )}
    </div>
  )
}
