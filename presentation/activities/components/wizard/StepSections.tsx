"use client"

import { SectionsContent } from "@/presentation/sites/components/form/SectionsContent"
import { ActivityCatalogPanel } from "@/presentation/catalog/components/ActivityCatalogPanel"
import type { StepProps } from "./StepKind"
import { StepSpaces } from "./StepSpaces"

/** Paso 8: secciones que se abren y cierran en la ficha, la carta y las promociones del sitio, y los espacios reservables. */
export function StepSections({ form, patch, context, activityId }: StepProps & { activityId?: string }) {
  return (
    <div className="grid gap-8">
      <SectionsContent value={form.sections} onChange={(sections) => patch({ sections })} />
      {form.kind === "site" && form.siteId && form.category ? <ActivityCatalogPanel siteId={form.siteId} activityId={activityId} activityTitle={form.title} category={form.category} /> : null}
      <StepSpaces form={form} patch={patch} context={context} />
    </div>
  )
}
