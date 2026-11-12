import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Container } from "@/app/components/layout/shared/Container"
import { createServerContainer } from "@/infraestructure/di/container"
import { GuestTicket } from "@/presentation/events/components/GuestTicket"
import { buildCheckInPayload, formatCheckInCode } from "@/domain/entities/EventRegistration/checkIn"
import { entryCode } from "@/domain/entities/EventRegistration/guest"

export const metadata: Metadata = { title: "Tu entrada", robots: { index: false, follow: false } }

async function Content({ params }: { params: Promise<{ eventId: string; code: string }> }) {
  const { eventId, code: raw } = await params
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(eventId) || !entryCode(raw)) notFound()
  const { eventGuestService, eventsService } = createServerContainer()
  const [ticket, event] = await Promise.all([eventGuestService.ticket(eventId, raw), eventsService.getEventById(eventId)])
  if (!ticket || !event) notFound()
  const when = new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(event.startDate))
  return <GuestTicket name={ticket.name} eventTitle={event.title} when={when} place={[event.location?.venue, event.location?.address].filter(Boolean).join(" · ")} payload={buildCheckInPayload({ eventId, code: ticket.code })} code={formatCheckInCode(ticket.code)} />
}

/** Entrada de una persona que se inscribió sin cuenta: el QR que muestra al llegar. La dirección es secreta (el código tiene 60 bits aleatorios). */
export default function EntradaPage({ params }: { params: Promise<{ eventId: string; code: string }> }) {
  return (
    <Container className="py-8 sm:py-12">
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-sm animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <Content params={params} />
      </Suspense>
    </Container>
  )
}
