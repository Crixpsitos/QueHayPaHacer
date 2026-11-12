"use client"

import { ACTIVITY_CATEGORIES, COMPANIONS, type Companion } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { DESCRIPTION_MAX, TAGLINE_MAX, TITLE_MAX } from "@/domain/entities/activities/Activity"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Field, ToggleChip, selectClass } from "./ui"
import type { StepProps } from "./StepKind"

const COMPANION_LABELS: Record<Companion, string> = { solo: "Solo", pareja: "En pareja", familia: "En familia", amigos: "Con amigos", ninos: "Con niños", mascotas: "Con mascotas" }
const OUTDOOR = new Set(["aire-libre", "deporte-y-bienestar", "turismo-y-paseos"])

/** Paso 2: qué es (título, gancho, descripción, categoría, con quién). Texto plano: sin enlaces ni código. */
export function StepBasics({ form, patch }: StepProps) {
  const toggleCompanion = (c: Companion) => patch({ companions: form.companions.includes(c) ? form.companions.filter((x) => x !== c) : [...form.companions, c] })
  return (
    <div className="grid gap-5">
      <Field label="Título" hint={`${form.title.length}/${TITLE_MAX}`}>
        {(id) => <Input id={id} value={form.title} maxLength={TITLE_MAX} placeholder="Ej: Senderismo los domingos" onChange={(e) => patch({ title: e.target.value })} />}
      </Field>
      <Field label="Frase gancho" optional hint="Una línea que invite a salir.">
        {(id) => <Input id={id} value={form.tagline} maxLength={TAGLINE_MAX} placeholder="Caminata por los cerros con almuerzo incluido" onChange={(e) => patch({ tagline: e.target.value })} />}
      </Field>
      <Field label="Descripción" hint={`${form.description.length}/${DESCRIPTION_MAX} · mínimo 20. Texto plano: sin enlaces (el botón de acción va después).`}>
        {(id) => <Textarea id={id} rows={5} value={form.description} maxLength={DESCRIPTION_MAX} placeholder="Cuenta qué se hace, para quién es y cómo es el ambiente." onChange={(e) => patch({ description: e.target.value })} />}
      </Field>
      <Field label="Categoría">
        {(id) => (
          <select id={id} className={selectClass} value={form.category} onChange={(e) => patch({ category: e.target.value as typeof form.category })}>
            <option value="">Elige una categoría</option>
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        )}
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">¿Con quién se puede ir? <span className="font-normal text-muted-foreground">(opcional)</span></legend>
        <div className="flex flex-wrap gap-2">
          {COMPANIONS.map((c) => (
            <ToggleChip key={c} pressed={form.companions.includes(c)} onClick={() => toggleCompanion(c)}>{COMPANION_LABELS[c]}</ToggleChip>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        {OUTDOOR.has(form.category) ? (
          <Field label="Dificultad" optional>
            {(id) => (
              <select id={id} className={selectClass} value={form.difficulty} onChange={(e) => patch({ difficulty: e.target.value as typeof form.difficulty })}>
                <option value="">Sin indicar</option>
                <option value="easy">Fácil</option>
                <option value="medium">Media</option>
                <option value="hard">Difícil</option>
              </select>
            )}
          </Field>
        ) : null}
        <Field label="Duración (minutos)" optional>
          {(id) => <Input id={id} inputMode="numeric" value={form.durationMinutes} placeholder="240" onChange={(e) => patch({ durationMinutes: e.target.value.replace(/\D/g, "").slice(0, 4) })} />}
        </Field>
      </div>
      <Field label="Nota de edad" optional hint="Ej: menores de 12 años con un adulto.">
        {(id) => <Input id={id} value={form.ageNote} maxLength={120} onChange={(e) => patch({ ageNote: e.target.value })} />}
      </Field>
    </div>
  )
}
