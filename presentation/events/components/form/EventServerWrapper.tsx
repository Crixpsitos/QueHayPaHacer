import { getTokens } from "next-firebase-auth-edge";
import { EventViewModel } from "../../view-models/EventViewModel";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { EventViewModelMapper } from "../../mapper/EventViewModelMapper";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheTag } from "next/cache";
import { cacheLife } from "next/cache";
import { EventClientWrapper } from "./EventClientWrapper";

interface EventFormServerWrapperProps {
  eventId: string;
}

const findDraftEvent = async (id: string, userId: string) => {
  "use cache";
  cacheTag(`event-${id}`);
  cacheLife({
    stale: 60,
    revalidate: 120,
    expire: 3600,
  });

  const { eventsService } = createServerContainer();
  return await eventsService.findDraftEventByIdAndUser(id, userId);
};

const getDraftEventData = async (
  id: string,
): Promise<EventViewModel | null> => {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return null;

  const eventData = await findDraftEvent(id, tokens.decodedToken.uid);

  if (!eventData) return null;

  return EventViewModelMapper.toViewModel(eventData);
};

export const EventServerWrapper = async ({
  eventId,
}: EventFormServerWrapperProps) => {
  const eventData = await getDraftEventData(eventId);

  return <EventClientWrapper mode="edit" initialData={eventData} />;
};
