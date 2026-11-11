import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { Container } from "@/app/components/layout/shared/Container"
import { getSessionUid } from "@/app/actions/_session"
import { getReservationsAction } from "@/app/actions/activities/join.action"
import { Reservations } from "@/presentation/activities/components/Reservations"

export const metadata: Metadata = { title: "Reservas", robots: { index: false, follow: false } }

async function Loader({ params }: { params: Promise<{ slug: string }> }) {
  // el segmento se llama [slug] por la ficha pública; aquí su valor es el id de la actividad
  const { slug: id } = await params
  if (!(await getSessionUid())) redirect(`/login?redirect_to=${encodeURIComponent(`/actividades/${id}/inscritos`)}`)
  const initial = await getReservationsAction(id)
  if (!initial) notFound() // ajena o inexistente: misma respuesta (no revela que existe)
  return <Reservations initial={initial} />
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
