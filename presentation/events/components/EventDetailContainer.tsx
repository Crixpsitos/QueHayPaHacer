import { notFound } from "next/navigation";
import { after } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { SessionViewModelMapper } from "../mapper/SessionViewModelMapper";
import { EventDetailClient } from "./EventDetailClient";
import { MultiDateEventDetailClient } from "./MultiDateEventDetailClient";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { recordEventViewAction } from "@/app/actions/events/record-event-view.action";
import {
  fetchEventDetailById,
  fetchEventDetailBySlug,
  fetchEventSessions,
  fetchUserLiked,
  fetchUserRegistered,
} from "../data/eventDetailFetchers";

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

  // Registrar vista del evento (misma lógica para standard y multi-date).
  after(async () => {
    await recordEventViewAction(event.id, userId);
  });

  // ── Multi-date: layout con lista de sesiones ──
  if (event.eventType === "multi-date") {
    const sessions = await fetchEventSessions(event.id);
    // Portadas se resuelven contra TODAS las sesiones ({ sessionId } refs);
    // el dueño previsualiza borradores, el público solo ve las publicadas.
    const sessionVMs = SessionViewModelMapper.toViewModels(
      sessions,
      viewModel.mainImage?.url,
    ).filter((s) => isOwner || s.status === "published");

    return (
      <MultiDateEventDetailClient
        event={viewModel}
        sessions={sessionVMs}
        initialLiked={initialLiked}
        isOwner={isOwner}
      />
    );
  }

  // El acceso al Estudio es solo para dueños con cuenta profesional; los demás
  // dueños ven un modal sencillo con sus inscritos.
  let isProfessionalOwner = false;
  if (isOwner && userId) {
    const { userService } = createServerContainer();
    const owner = await userService.getUserById(userId);
    isProfessionalOwner = owner?.accountType === "professional";
  }

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
