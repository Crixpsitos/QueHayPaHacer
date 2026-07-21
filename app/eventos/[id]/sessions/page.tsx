import { notFound } from "next/navigation";
import { EventDetailSkeleton } from "@/presentation/events/components/EventDetailSkeleton";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import { SessionManagerContainer } from "@/presentation/events/components/session/SessionManagerContainer";

interface SessionsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Con Cache Components, los datos sin cachear (cookies del usuario) deben leerse
 * dentro de un <Suspense> o el prerender falla.
 */
export default function EventSessionsPage({ params }: SessionsPageProps) {
  return (
    <ServerBoundary params={params} fallback={<EventDetailSkeleton />}>
      {({ params: { id } }) => {
        if (!id) return notFound();
        return <SessionManagerContainer eventId={id} />;
      }}
    </ServerBoundary>
  );
}
