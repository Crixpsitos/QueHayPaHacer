"use client"

import { useState } from "react"
import { Input } from "@/app/components/ui/input"
import { CTA_LABEL_MAX, CTA_VALUE_MAX, type CtaKind } from "@/domain/entities/activities/value-objects/Cta"
import { Switch } from "@/app/components/ui/switch"
import { JOIN_CAPACITY_MAX, PAY_INSTRUCTIONS_MAX, isPaidActivity } from "@/domain/entities/activities/activityJoin"
import { parseMoney } from "@/presentation/activities/lib/activityForm"
import { Field, RadioCard, selectClass } from "./ui"
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

/** Paso 7: reservas en QHPA (cupo por salida, cómo se paga) y el botón a otro lugar. Las dos son opcionales. */
export function StepCta({ form, patch }: StepProps) {
  const k = KINDS.find((x) => x.value === form.ctaKind)
  const paid = isPaidActivity(form.priceOptions.map((p) => ({ amountCop: parseMoney(p.amount) || 0 })))
  // local: al borrar los dígitos el campo no debe desaparecer
  const [capped, setCapped] = useState(form.joinCapacity !== "")
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-3xl border border-border bg-card p-4" aria-labelledby="join-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="join-title" className="text-lg font-semibold">Reservas en Qué Hay Pa Hacer</h2>
            <p className="text-xs text-muted-foreground">La gente aparta su cupo con su cuenta. Es gratis para ti. El pago lo coordinas tú, directo con cada persona.</p>
          </div>
          <Switch checked={form.joinEnabled} onCheckedChange={(v) => patch({ joinEnabled: v })} aria-label="Recibir reservas" />
        </div>
        {form.joinEnabled ? (
          <>
            <div className="grid gap-2" role="radiogroup" aria-label="Cupo por salida">
              <div className="text-sm font-semibold">Cupo por salida</div>
              <RadioCard name="cap" checked={!capped} onChange={() => { setCapped(false); patch({ joinCapacity: "" }) }} title="Sin tope" description="Cualquiera puede unirse." />
              <RadioCard name="cap" checked={capped} onChange={() => setCapped(true)} title="Con tope de personas" description="Al llegar al tope, la salida se marca como llena." />
              {capped ? (
                <Field label="Personas por salida" hint={`Entre 1 y ${JOIN_CAPACITY_MAX}. Cada salida tiene su propio cupo: si sales los domingos, el 15 y el 22 se llenan por separado.`}>
                  {(id) => <Input id={id} type="number" inputMode="numeric" min={1} max={JOIN_CAPACITY_MAX} className="w-32" value={form.joinCapacity} onChange={(e) => patch({ joinCapacity: e.target.value })} />}
                </Field>
              ) : null}
            </div>
            {paid ? (
              <>
                <Field label="Cómo se paga" hint="Se muestra a quien reserva. Como tu entrada cuesta, la persona te dejará su WhatsApp para que la contactes.">
                  {(id) => <Input id={id} value={form.payInstructions} maxLength={PAY_INSTRUCTIONS_MAX} placeholder="Nequi 300 765 4321, a nombre de…" onChange={(e) => patch({ payInstructions: e.target.value })} />}
                </Field>
                <p className="rounded-2xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground"><strong>Su WhatsApp es un dato personal.</strong> Solo lo ves tú, solo para coordinar esta reserva, y la persona lo autoriza al reservar. Úsalo únicamente para eso.</p>
              </>
            ) : <p className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">Tu actividad es gratis: quien se une queda confirmado al instante y no se le pide teléfono.</p>}
          </>
        ) : null}
      </section>
      <Field label="Botón a otro lugar" optional hint="Grupo de WhatsApp, enlace, llamada o reserva externa.">
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
