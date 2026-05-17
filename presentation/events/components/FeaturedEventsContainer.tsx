import { EventCardInteractive } from "./card/EventCardInteractive";
import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";

const fetchFeaturedEvents = async (userId?: string) => {
  "use cache"
  cacheLife({
    expire: 120,
    stale: 60,
    revalidate: 60
  })
  cacheTag("featured-events")
  const {eventFeed} = createServerContainer();
  return await eventFeed.getFeatured(userId);
}


export const FeaturedEventsContainer = async () => {
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const featuredEvents = await fetchFeaturedEvents(userId);

  const featuredEventsViewModels = featuredEvents.map((event) =>
    EventViewModelMapper.toViewModel(event.event),
  );

  const featuredEventsInteractions = featuredEvents.map(
    (event) => event.interaction,
  );

  const likedByEventId = Object.fromEntries(
    featuredEventsInteractions
      .filter((interaction): interaction is NonNullable<typeof interaction> =>
        Boolean(interaction),
      )
      .map((interaction) => [interaction.eventId, interaction.liked]),
  );




  return (
    <EventCardInteractive
      events={featuredEventsViewModels}
      attendeeCount={featuredEventsViewModels.reduce(
        (total, event) => total + (event.analytics?.registrations || 0),
        0,
      )}
      likedByEventId={likedByEventId}
    />
  );
};
