"use client"

import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { MEETING_REFERENCES_MAX } from "@/domain/entities/activities/Activity"
import { CONFIRM_CHANNELS, CONFIRM_LABELS, type ConfirmChannel } from "@/domain/entities/activities/value-objects/MeetingConfirm"
import { cn } from "@/app/lib/utils/cn"
import { MeetingMap } from "./MeetingMap"
import { Field, RadioCard } from "./ui"
import type { StepProps } from "./StepKind"

const PLACEHOLDER: Record<ConfirmChannel, string> = {
  whatsapp: "https://chat.whatsapp.com/…",
  instagram: "https://instagram.com/tu_perfil",
  telegram: "https://t.me/tu_grupo",
  other: "https://…",
}

/** Paso 5: punto de encuentro. En actividades de sitio el lugar es el del sitio; en las globales es un lugar fijo (con mapa) o cambia cada vez (y se confirma por un enlace). */
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
        <RadioCard name="meeting" checked={form.meetingMode === "fixed"} onChange={() => patch({ meetingMode: "fixed" })} title="Siempre el mismo lugar" description="Lo eliges en el mapa y se muestra en la ficha, con cómo llegar." />
        <RadioCard name="meeting" checked={form.meetingMode === "varies"} onChange={() => patch({ meetingMode: "varies" })} title="Cambia cada vez" description="La ficha avisa que el punto cambia y manda a quien reserva al enlace donde lo confirmas." />
      </div>

      {form.meetingMode === "fixed" ? (
        <>
          <MeetingMap text={form.meetingText} geo={form.meetingGeo} onChange={(next) => patch({ ...(next.text !== undefined ? { meetingText: next.text } : {}), ...(next.geo !== undefined ? { meetingGeo: next.geo } : {}) })} />
          <Field label="Referencias" optional hint="Cómo reconocerlos: color de camiseta, bandera…">
            {(id) => <Textarea id={id} rows={2} value={form.meetingReferences} maxLength={MEETING_REFERENCES_MAX} onChange={(e) => patch({ meetingReferences: e.target.value })} />}
          </Field>
        </>
      ) : (
        <section className="grid gap-4 rounded-3xl border border-border bg-card p-4" aria-labelledby="confirm-t">
          <div>
            <h2 id="confirm-t" className="text-base font-semibold">¿Dónde se confirma el punto?</h2>
            <p className="text-xs text-muted-foreground">Elige el medio y pega el enlace del grupo o perfil. La gente lo verá en la ficha.</p>
          </div>
          <div role="radiogroup" aria-label="Medio de confirmación" className="flex flex-wrap gap-2">
            {CONFIRM_CHANNELS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={form.confirmChannel === c} onClick={() => patch({ confirmChannel: c })} className={cn("min-h-11 rounded-full border-[1.5px] px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 motion-reduce:transition-none", form.confirmChannel === c ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-background hover:bg-muted")}>{CONFIRM_LABELS[c]}</button>
            ))}
          </div>
          <Field label={form.confirmChannel === "instagram" ? "Enlace de tu perfil o grupo" : "Enlace del grupo o canal"}>
            {(id) => <Input id={id} type="url" inputMode="url" value={form.confirmUrl} placeholder={PLACEHOLDER[form.confirmChannel]} onChange={(e) => patch({ confirmUrl: e.target.value })} />}
          </Field>
        </section>
      )}
    </div>
  )
}
