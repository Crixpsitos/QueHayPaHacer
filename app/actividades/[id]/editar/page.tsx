import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { Container } from "@/app/components/layout/shared/Container"
import { getActivityForEditAction, getActivityWizardContextAction } from "@/app/actions/activities/wizard-data.action"
import { ActivityWizard } from "@/presentation/activities/components/wizard/ActivityWizard"

export const metadata: Metadata = { title: "Editar actividad", robots: { index: false, follow: false } }

async function EditLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [context, initial] = await Promise.all([getActivityWizardContextAction(), getActivityForEditAction(id)])
  if (!context) redirect(`/login?redirect_to=${encodeURIComponent(`/actividades/${id}/editar`)}`)
  if (!initial) notFound()
  return <ActivityWizard context={context} initial={initial} />
}

export default function EditarActividadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Container className="py-4">
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-xl animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <EditLoader params={params} />
      </Suspense>
    </Container>
  )
}
