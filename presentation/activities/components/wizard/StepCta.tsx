"use client"

import { Input } from "@/app/components/ui/input"
import { CTA_LABEL_MAX, CTA_VALUE_MAX, type CtaKind } from "@/domain/entities/activities/value-objects/Cta"
import { Field, selectClass } from "./ui"
import type { StepProps } from "./StepKind"

const KINDS: { value: CtaKind; label: string; placeholder: string; hint: string; defaultLabel: string }[] = [
  { value: "whatsappGroup", label: "Unirse a un grupo de WhatsApp", placeholder: "https://chat.whatsapp.com/…", hint: "El enlace de invitación de tu grupo. Ahí pueden coordinar el punto de encuentro.", defaultLabel: "Unirme al grupo" },
  { value: "whatsapp", label: "Escribir por WhatsApp", placeholder: "300 123 4567", hint: "Un celular colombiano de 10 dígitos.", defaultLabel: "Escribir por WhatsApp" },
  { value: "website", label: "Página web", placeholder: "https://…", hint: "Solo enlaces seguros (https).", defaultLabel: "Ver más" },
  { value: "reserveLink", label: "Enlace para reservar", placeholder: "https://…", hint: "Donde se hace la reserva.", defaultLabel: "Reservar" },
  { value: "buyLink", label: "Enlace para comprar", placeholder: "https://…", hint: "Donde se compra o se paga. El pago no ocurre en Qué Hay Pa Hacer.", defaultLabel: "Comprar" },
  { value: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/tu_cuenta", hint: "El enlace de tu perfil.", defaultLabel: "Ver en Instagram" },
  { value: "phone", label: "Llamar por teléfono", placeholder: "300 123 4567", hint: "Celular o fijo de 10 dígitos.", defaultLabel: "Llamar" },
]

/** Paso 7: el botón de acción que verá la gente. Opcional (también pueden inscribirse desde la plataforma). */
export function StepCta({ form, patch }: StepProps) {
  const k = KINDS.find((x) => x.value === form.ctaKind)
  return (
    <div className="grid gap-5">
      <Field label="Tipo de botón" optional hint="Si no pones ninguno, la gente solo podrá reservar su cupo en Qué Hay Pa Hacer.">
        {(id) => (
          <select id={id} className={selectClass} value={form.ctaKind} onChange={(e) => patch({ ctaKind: e.target.value as CtaKind | "", ctaValue: "", ctaLabel: "" })}>
            <option value="">Sin botón</option>
            {KINDS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        )}
      </Field>
      {k ? (
        <>
          <Field label={k.value === "whatsapp" || k.value === "phone" ? "Número" : "Enlace"} hint={k.hint}>
            {(id) => <Input id={id} value={form.ctaValue} maxLength={CTA_VALUE_MAX} placeholder={k.placeholder} inputMode={k.value === "whatsapp" || k.value === "phone" ? "tel" : "url"} onChange={(e) => patch({ ctaValue: e.target.value })} />}
          </Field>
          <Field label="Texto del botón" optional hint={`Si lo dejas vacío dirá "${k.defaultLabel}".`}>
            {(id) => <Input id={id} value={form.ctaLabel} maxLength={CTA_LABEL_MAX} onChange={(e) => patch({ ctaLabel: e.target.value })} />}
          </Field>
          <div className="rounded-2xl border border-border bg-card p-4" aria-live="polite">
            <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">ASÍ SE VERÁ</div>
            <span className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold">{form.ctaLabel.trim() || k.defaultLabel}</span>
          </div>
        </>
      ) : null}
    </div>
  )
}
