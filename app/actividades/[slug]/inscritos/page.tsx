import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { Container } from "@/app/components/layout/shared/Container"
import { getSessionUid } from "@/app/actions/_session"
import { getReservationsAction } from "@/app/actions/activities/join.action"
import { listActivityRequestsAction } from "@/app/actions/activities/request.action"
import { ActivityRequests } from "@/presentation/activities/components/ActivityRequests"
import { Reservations } from "@/presentation/activities/components/Reservations"

export const metadata: Metadata = { title: "Reservas", robots: { index: false, follow: false } }

async function Loader({ params }: { params: Promise<{ slug: string }> }) {
  // el segmento se llama [slug] por la ficha pública; aquí su valor es el id de la actividad
  const { slug: id } = await params
  if (!(await getSessionUid())) redirect(`/login?redirect_to=${encodeURIComponent(`/actividades/${id}/inscritos`)}`)
  const [initial, requests] = await Promise.all([getReservationsAction(id), listActivityRequestsAction(id)])
  if (!initial) notFound() // ajena o inexistente: misma respuesta (no revela que existe)
  return (
    <div className="grid gap-8">
      <Reservations initial={initial} />
      {requests ? <ActivityRequests rows={requests} /> : null}
    </div>
  )
}

export default function ReservasPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Container className="py-4">
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-2xl animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <Loader params={params} />
      </Suspense>
    </Container>
  )
}
