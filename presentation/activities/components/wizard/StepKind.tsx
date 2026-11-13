"use client"

import Link from "next/link"
import type { WizardContext } from "@/app/actions/activities/wizard-data.action"
import type { ActivityForm } from "@/presentation/activities/lib/activityForm"
import { RadioCard } from "./ui"
import { SitePickCards } from "./SitePickCards"

export interface StepProps {
  form: ActivityForm
  patch: (p: Partial<ActivityForm>) => void
  context: WizardContext
}

/** Paso 1: ¿es una actividad global o de un sitio propio? (D12: solo de sitios propios). */
export function StepKind({ form, patch, context }: StepProps) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3" role="radiogroup" aria-label="Tipo de actividad">
        <RadioCard name="kind" checked={form.kind === "global"} onChange={() => patch({ kind: "global", siteId: null })} title="Global" description="No depende de un lugar: una comunidad, un grupo, una salida que cambia de punto." />
        <RadioCard name="kind" checked={form.kind === "site"} onChange={() => patch({ kind: "site" })} title="De un sitio mío" description="Pasa en un sitio que tú publicaste: comer helado en tu heladería, el club de lectura de tu café." />
      </div>
      {form.kind === "site" ? (
        context.sites.length ? (
          <SitePickCards sites={context.sites} value={form.siteId} onChange={(siteId) => patch({ siteId })} />
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            Todavía no tienes sitios propios publicados y aprobados. <Link href="/sites" className="font-semibold text-primary-dark underline">Publica tu sitio</Link> o elige una actividad global.
          </p>
        )
      ) : null}
    </div>
  )
}
