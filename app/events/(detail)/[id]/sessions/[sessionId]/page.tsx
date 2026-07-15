import { notFound } from "next/navigation";
import { after } from "next/server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { SessionViewModelMapper } from "@/presentation/events/mapper/SessionViewModelMapper";
import { EventDetailClient } from "@/presentation/events/components/EventDetailClient";
import {
  fetchEventDetailById,
  fetchEventDetailBySlug,
  fetchEventSessions,
  fetchUserLiked,
  fetchUserRegistered,
} from "@/presentation/events/data/eventDetailFetchers";
import { recordEventViewAction } from "@/app/actions/events/record-event-view.action";

interface SessionDetailPageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id, sessionId } = await params;

  // Mismas funciones cacheadas que el detalle del evento (comparten caché/tags).
  let parent = await fetchEventDetailBySlug(id);
  if (!parent) parent = await fetchEventDetailById(id);

  if (!parent || parent.status !== "published" || parent.eventType !== "multi-date") {
    return notFound();
  }

  const sessions = await fetchEventSessions(parent.id);
  // `sessionId` en la URL puede ser el slug (nuevo) o el id (compat / sesiones sin slug).
  const session = sessions.find((s) => s.slug === sessionId) ??
    sessions.find((s) => s.id === sessionId);
  if (!session || session.status !== "published") return notFound();

  const parentVM = EventViewModelMapper.toViewModel(parent);
  const sessionVM = SessionViewModelMapper.toViewModel(
    session,
    parentVM.mainImage?.url,
    sessions,
  );
  const mergedVM = SessionViewModelMapper.toEventViewModel(sessionVM, parentVM);

  // Like/registro viven en el evento padre (las sesiones no tienen infra propia).
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const [initialLiked, initialRegistered] = userId && parent.id
    ? await Promise.all([
        fetchUserLiked(parent.id, userId, session.id),
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
