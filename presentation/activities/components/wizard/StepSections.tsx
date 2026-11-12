"use client"

import { SectionsContent } from "@/presentation/sites/components/form/SectionsContent"
import type { StepProps } from "./StepKind"
import { StepOfferings } from "./StepOfferings"

/** Paso 8: secciones que se abren y cierran en la ficha (qué incluye, qué llevar, reglas). Reutiliza el editor de sitios. */
export function StepSections({ form, patch, context }: StepProps) {
  return (
    <div className="grid gap-8">
      <SectionsContent value={form.sections} onChange={(sections) => patch({ sections })} />
      <StepOfferings form={form} patch={patch} context={context} />
    </div>
  )
}
