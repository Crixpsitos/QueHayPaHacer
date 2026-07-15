import { notFound } from "next/navigation";
import { EventDetailSkeleton } from "@/presentation/events/components/EventDetailSkeleton";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import { SessionDetailContainer } from "@/presentation/events/components/SessionDetailContainer";

interface SessionDetailPageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

/**
 * Con Cache Components, los datos sin cachear (cookies del usuario) deben leerse
 * dentro de un <Suspense> o el prerender falla. `ServerBoundary` lo envuelve,
 * igual que el detalle del evento.
 */
export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <ServerBoundary params={params} fallback={<EventDetailSkeleton />}>
      {({ params: { id, sessionId } }) => {
        if (!id || !sessionId) return notFound();
        return <SessionDetailContainer eventId={id} sessionRef={sessionId} />;
      }}
    </ServerBoundary>
  );
}
