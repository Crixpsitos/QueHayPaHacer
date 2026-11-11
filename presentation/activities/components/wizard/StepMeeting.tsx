"use client"

import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { MEETING_REFERENCES_MAX, MEETING_TEXT_MAX } from "@/domain/entities/activities/Activity"
import { Field, RadioCard } from "./ui"
import type { StepProps } from "./StepKind"

/** Paso 5: punto de encuentro. En actividades de sitio el lugar es el del sitio; en las globales puede decirse en el grupo. */
export function StepMeeting({ form, patch }: StepProps) {
  if (form.kind === "site") {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
        Esta actividad ocurre en tu sitio, así que usamos su dirección y su mapa. No tienes que escribir nada aquí. Si hace falta una indicación, ponla en la descripción o en las secciones.
      </p>
    )
  }
  return (
    <div className="grid gap-5">
      <div className="grid gap-3" role="radiogroup" aria-label="Punto de encuentro">
        <RadioCard name="meeting" checked={form.meetingMode === "fixed"} onChange={() => patch({ meetingMode: "fixed" })} title="Siempre el mismo lugar" description="Lo escribes aquí y se muestra en la ficha." />
        <RadioCard name="meeting" checked={form.meetingMode === "sharedAfterJoining"} onChange={() => patch({ meetingMode: "sharedAfterJoining" })} title="Se dice en el grupo de WhatsApp" description="La ficha avisa que el punto se comparte al unirse." />
        <RadioCard name="meeting" checked={form.meetingMode === "varies"} onChange={() => patch({ meetingMode: "varies" })} title="Cambia cada vez" description="La ficha avisa que el punto cambia y se confirma antes de cada salida." />
      </div>
      {form.meetingMode === "fixed" ? (
        <>
          <Field label="Punto de encuentro" hint="Una dirección o un lugar conocido.">
            {(id) => <Input id={id} value={form.meetingText} maxLength={MEETING_TEXT_MAX} placeholder="Ej: Parque Murillo Toro, frente a la catedral" onChange={(e) => patch({ meetingText: e.target.value })} />}
          </Field>
          <Field label="Referencias" optional hint="Cómo reconocerlos: color de camiseta, bandera…">
            {(id) => <Textarea id={id} rows={2} value={form.meetingReferences} maxLength={MEETING_REFERENCES_MAX} onChange={(e) => patch({ meetingReferences: e.target.value })} />}
          </Field>
        </>
      ) : null}
    </div>
  )
}
