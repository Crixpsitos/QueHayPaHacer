import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Container } from "@/app/components/layout/shared/Container"
import { getActivityWizardContextAction } from "@/app/actions/activities/wizard-data.action"
import { ActivityWizard } from "@/presentation/activities/components/wizard/ActivityWizard"

// Área privada: fuera del índice (el proxy ya exige sesión).
export const metadata: Metadata = { title: "Crear actividad", robots: { index: false, follow: false } }

async function CreateLoader() {
  const context = await getActivityWizardContextAction()
  if (!context) redirect("/login?redirect_to=%2Factividades%2Fcrear")
  return <ActivityWizard context={context} />
}

export default function CrearActividadPage() {
  return (
    <Container className="py-4">
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-xl animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <CreateLoader />
      </Suspense>
    </Container>
  )
}
