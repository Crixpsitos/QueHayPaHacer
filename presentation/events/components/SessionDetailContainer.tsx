import { notFound } from "next/navigation";
import { after } from "next/server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { SessionViewModelMapper } from "@/presentation/events/mapper/SessionViewModelMapper";
import { EventDetailClient } from "./EventDetailClient";
import {
  fetchEventDetailById,
  fetchEventDetailBySlug,
  fetchEventSessions,
  fetchUserLiked,
  fetchUserRegistered,
} from "../data/eventDetailFetchers";
import { recordEventViewAction } from "@/app/actions/events/record-event-view.action";

interface SessionDetailContainerProps {
  /** Slug o id del evento padre. */
  eventId: string;
  /** Slug o id de la sesión, tal como viene en la URL. */
  sessionRef: string;
}

/**
 * Detalle público de una sesión. Vive fuera de `page.tsx` para poder leerse
 * dentro del <Suspense> de `ServerBoundary`: lee cookies (datos sin cachear) y
 * con Cache Components eso fuera de un boundary rompe el prerender.
 */
export async function SessionDetailContainer({
  eventId,
  sessionRef,
}: SessionDetailContainerProps) {
  // Mismas funciones cacheadas que el detalle del evento (comparten caché/tags).
  let parent = await fetchEventDetailBySlug(eventId);
  if (!parent) parent = await fetchEventDetailById(eventId);

  if (!parent || parent.status !== "published" || parent.eventType !== "multi-date") {
    return notFound();
  }

  const sessions = await fetchEventSessions(parent.id);
  // La URL puede traer el slug (nuevo) o el id (compat / sesiones sin slug).
  const session =
    sessions.find((s) => s.slug === sessionRef) ??
    sessions.find((s) => s.id === sessionRef);
  if (!session || session.status !== "published") return notFound();

  const parentVM = EventViewModelMapper.toViewModel(parent);
  const sessionVM = SessionViewModelMapper.toViewModel(
    session,
    parentVM.mainImage?.url,
    sessions,
  );
  const mergedVM = SessionViewModelMapper.toEventViewModel(sessionVM, parentVM);

  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const [initialLiked, initialRegistered] =
    userId && parent.id
      ? await Promise.all([
          // El like es del EVENTO (comparte caché con el detalle del evento);
          // el registro sí es de esta fecha.
          fetchUserLiked(parent.id, userId),
          fetchUserRegistered(parent.id, userId, session.id),
        ])
      : [false, false];

  const isOwner = Boolean(userId && parent.author?.id && userId === parent.author.id);

  let isProfessionalOwner = false;
  if (isOwner && userId) {
    const { userService } = createServerContainer();
    const owner = await userService.getUserById(userId);
    isProfessionalOwner = owner?.accountType === "professional";
  }

  after(async () => {
    await recordEventViewAction(parent.id, userId);
  });

  const parentRef = parent.slug || parent.id;

  return (
    <EventDetailClient
      event={mergedVM}
      initialLiked={initialLiked}
      initialRegistered={initialRegistered}
      isOwner={isOwner}
      isProfessionalOwner={isProfessionalOwner}
      shareUrl={`/events/${parentRef}/sessions/${session.slug || session.id}`}
      backLink={{ href: `/events/${parentRef}`, label: parent.title }}
      editSessionHref={`/events/${parent.id}/edit?step=sessions`}
      sessionId={session.id}
    />
  );
}
