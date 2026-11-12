import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Container } from "@/app/components/layout/shared/Container"
import { getMyActivitiesAction } from "@/app/actions/activities/my-activities.action"
import { MyActivities } from "@/presentation/activities/components/MyActivities"

// Área privada: fuera del índice (el proxy ya exige sesión).
export const metadata: Metadata = { title: "Mis actividades", robots: { index: false, follow: false } }

async function MineLoader() {
  const items = await getMyActivitiesAction()
  if (!items) redirect("/login?redirect_to=%2Factividades%2Fmis")
  return <MyActivities items={items} />
}

export default function MisActividadesPage() {
  return (
    <Container className="py-4">
      <Suspense fallback={<div className="mx-auto h-72 w-full max-w-3xl animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <MineLoader />
      </Suspense>
    </Container>
  )
}
