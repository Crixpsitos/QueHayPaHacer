import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { after } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";
import type { Events } from "@/domain/entities/events/Events";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { EventDetailClient } from "./EventDetailClient";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { recordEventViewAction } from "@/app/actions/events/record-event-view.action";

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
  /** Puede ser un slug (eventos nuevos) o un ID de documento Firestore (eventos legacy) */
  eventId: string;
}

export const EventDetailContainer = async ({ eventId }: EventDetailContainerProps) => {
  // Intentar buscar por slug primero; si no se encuentra, usar búsqueda directa por ID (eventos legacy)
  let event = await fetchEventDetailBySlug(eventId);
  if (!event) {
    event = await fetchEventDetailById(eventId);
  }

  if (!event || event.status !== "published") return notFound();

  const viewModel = EventViewModelMapper.toViewModel(event);

  // Resolver estado de like y registro del usuario (no bloqueante — por defecto false si no autenticado)
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const [initialLiked, initialRegistered] = userId && event.id
    ? await Promise.all([
        fetchUserLiked(event.id, userId),
        fetchUserRegistered(event.id, userId),
      ])
    : [false, false];

  // El dueño no puede inscribirse a su propio evento (sí puede dar like / compartir).
  const isOwner = Boolean(userId && event.author?.id && userId === event.author.id);

  // El acceso al Estudio es solo para dueños con cuenta profesional; los demás
  // dueños ven un modal sencillo con sus inscritos.
  let isProfessionalOwner = false;
  if (isOwner && userId) {
    const { userService } = createServerContainer();
    const owner = await userService.getUserById(userId);
    isProfessionalOwner = owner?.accountType === "professional";
  }

  // Registrar vista del evento de forma asincrónica sin bloquear la respuesta
  // Solo se registra si el usuario está autenticado y es su primera vista del evento
  after(async () => {
    await recordEventViewAction(event.id, userId);
  });

  return (
    <EventDetailClient
      event={viewModel}
      initialLiked={initialLiked}
      initialRegistered={initialRegistered}
      isOwner={isOwner}
      isProfessionalOwner={isProfessionalOwner}
    />
  );
};
