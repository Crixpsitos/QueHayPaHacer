import { EventClientWrapper } from "@/presentation/events/components/form/EventClientWrapper";
import { EventFormSkeleton } from "@/presentation/events/components/form/EventFormSkeleton";
import { ServerDraftEventModalHydration } from "@/presentation/events/components/hydrator/ServerDraftEventModalHydration";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";

interface CreateEventPageProps {
  searchParams: Promise<{ isNew: string }>;
}

export default async function CreateEventPage({
  searchParams,
}: CreateEventPageProps) {
  return (
    <>
      <ServerBoundary<unknown, { isNew: string }>
        searchParams={searchParams}
        fallback={<EventFormSkeleton />}
      >
        {({ searchParams }) => (
          <>
            <EventClientWrapper mode="create" />
            <ServerDraftEventModalHydration
              isNew={searchParams.isNew === "true"}
            />
          </>
        )}
      </ServerBoundary>
    </>
  );
}
