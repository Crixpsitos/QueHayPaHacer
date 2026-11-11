"use client"

import { SectionsContent } from "@/presentation/sites/components/form/SectionsContent"
import type { StepProps } from "./StepKind"

/** Paso 8: secciones que se abren y cierran en la ficha (qué incluye, qué llevar, reglas). Reutiliza el editor de sitios. */
export function StepSections({ form, patch }: StepProps) {
  return <SectionsContent value={form.sections} onChange={(sections) => patch({ sections })} />
}
