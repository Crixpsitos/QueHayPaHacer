import { notFound } from "next/navigation";
import { EventDetailContainer } from "@/presentation/events/components/EventDetailContainer";
import { EventDetailSkeleton } from "@/presentation/events/components/EventDetailSkeleton";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  return (
    <ServerBoundary
      params={params}
      fallback={<EventDetailSkeleton />}
    >
      {({ params: { id } }) => {
        if (!id) return notFound();
        return <EventDetailContainer eventId={id} />;
      }}
    </ServerBoundary>
  );
}
