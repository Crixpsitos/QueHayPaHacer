import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type { Events } from "@/domain/entities/events/Events";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { EventDetailClient } from "./EventDetailClient";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";

const fetchEventDetailById = async (id: string): Promise<Events | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`event-${id}`);
  const { eventsService } = createServerContainer();
  return await eventsService.getEventById(id);
};

const fetchEventDetailBySlug = async (slug: string): Promise<Events | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`event-slug-${slug}`);
  const { eventsService } = createServerContainer();
  return await eventsService.getEventBySlug(slug);
};

const fetchUserLiked = async (eventId: string, userId: string): Promise<boolean> => {
  "use cache";
  cacheLife({ expire: 300, stale: 60, revalidate: 60 });
  cacheTag(`event-interaction-${userId}-${eventId}`);
  const { eventInteractionsService } = createServerContainer();
  const interaction = await eventInteractionsService.getByEventAndUser(eventId, userId);
  return !!interaction?.liked;
};

const fetchUserRegistered = async (eventId: string, userId: string): Promise<boolean> => {
  "use cache";
  cacheLife({ expire: 300, stale: 60, revalidate: 60 });
  cacheTag(`event-registration-${userId}-${eventId}`);
  const { eventRegistrationService } = createServerContainer();
  return await eventRegistrationService.isUserRegistered(eventId, userId);
};

interface EventDetailContainerProps {
  /** Can be either a slug (new events) or a Firestore document ID (legacy events) */
  eventId: string;
}

export const EventDetailContainer = async ({ eventId }: EventDetailContainerProps) => {
  // Try slug first; if not found fall back to direct ID lookup (legacy events)
  let event = await fetchEventDetailBySlug(eventId);
  if (!event) {
    event = await fetchEventDetailById(eventId);
  }

  if (!event || event.status !== "published") return notFound();

  const viewModel = EventViewModelMapper.toViewModel(event);

  // Resolve user like and registration state (non-blocking — defaults to false if unauthenticated)
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const [initialLiked, initialRegistered] = userId && event.id
    ? await Promise.all([
        fetchUserLiked(event.id, userId),
        fetchUserRegistered(event.id, userId),
      ])
    : [false, false];

  return (
    <EventDetailClient
      event={viewModel}
      initialLiked={initialLiked}
      initialRegistered={initialRegistered}
    />
  );
};
