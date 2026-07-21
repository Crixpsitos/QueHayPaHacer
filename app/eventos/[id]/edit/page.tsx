import { EventFormSkeleton } from "@/presentation/events/components/form/EventFormSkeleton";
import { EventServerWrapper } from "@/presentation/events/components/form/EventServerWrapper";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  return (
      <ServerBoundary params={params} fallback={<EventFormSkeleton />}>
        {({ params }) => <EventServerWrapper eventId={params.id} />}
      </ServerBoundary>
  );
}
