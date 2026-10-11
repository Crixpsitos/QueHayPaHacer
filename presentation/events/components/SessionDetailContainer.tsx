import { notFound } from "next/navigation";
import { fetchPublicSiteDetail } from "@/presentation/sites/data/siteDetailFetchers";
import { getSiteOpenStatus } from "@/presentation/sites/lib/openStatus";
import { after } from "next/server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { SessionViewModelMapper } from "@/presentation/events/mapper/SessionViewModelMapper";
import { EventDetailClient } from "./EventDetailClient";
import type { LinkedSiteInfo } from "./detail/EventPlace";
import {
  fetchEventDetailById,
  fetchEventDetailBySlug,
  fetchEventSessions,
  fetchUserLiked,
  fetchUserRegistered,
} from "../data/eventDetailFetchers";
import { recordEventView } from "@/app/actions/events/_recordEventView";

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

  let isPremiumOwner = false;
  if (isOwner && userId) {
    const { userService } = createServerContainer();
    const owner = await userService.getUserById(userId);
    isPremiumOwner = owner?.plan === "premium";
  }

  // Sitio vinculado (si la sesión tiene location.siteId)
  let linkedSite: LinkedSiteInfo | undefined;
  const siteId = session.location?.siteId;
  if (siteId) {
    // Solo sitios públicos (no borradores/rechazados), cacheado y con hora de Colombia.
    const site = await fetchPublicSiteDetail(siteId);
    if (site) {
      const { isOpen, label } = getSiteOpenStatus(site.schedule);
      linkedSite = { id: site.id, slug: site.slug, name: site.name, category: site.category, address: site.address, coverUrl: site.coverUrl, isOpen, openLabel: label ?? "Horario no disponible" };
    }
  }

  after(async () => {
    await recordEventView(parent.id, userId);
  });

  const parentRef = parent.slug || parent.id;

  return (
    <EventDetailClient
      event={mergedVM}
      initialLiked={initialLiked}
      initialRegistered={initialRegistered}
      isOwner={isOwner}
      isPremiumOwner={isPremiumOwner}
      shareUrl={`/eventos/${parentRef}/sessions/${session.slug || session.id}`}
      backLink={{ href: `/eventos/${parentRef}`, label: parent.title }}
      editSessionHref={`/eventos/${parent.id}/edit?step=sessions`}
      sessionId={session.id}
      linkedSite={linkedSite}
    />
  );
}
