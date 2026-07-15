import { getTokens } from "next-firebase-auth-edge";
import { notFound } from "next/navigation";
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

const findEditableEvent = async (id: string, userId: string) => {
  "use cache";
  cacheTag(`event-${id}`);
  cacheLife({
    stale: 60,
    revalidate: 120,
    expire: 3600,
  });

  const { eventsService } = createServerContainer();
  const event = await eventsService.getEventById(id);

  // Solo el autor puede editar, sin importar el estado (borrador o publicado).
  if (!event || event.author.id !== userId) return null;

  return event;
};

const getEditableEventData = async (
  id: string,
): Promise<EventViewModel | null> => {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return null;

  const eventData = await findEditableEvent(id, tokens.decodedToken.uid);

  if (!eventData) return null;

  return EventViewModelMapper.toViewModel(eventData);
};

export const EventServerWrapper = async ({
  eventId,
}: EventFormServerWrapperProps) => {
  const eventData = await getEditableEventData(eventId);

  // El evento no existe (o no es del autor) → 404.
  if (!eventData) {
    notFound();
  }

  // El wizard renderiza el tipo correcto según eventData.eventType:
  // standard → 7 pasos; multi-date → 5 pasos con gestor de sesiones.
  return <EventClientWrapper mode="edit" initialData={eventData} />;
};
