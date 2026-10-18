import { notFound } from "next/navigation";
import { fetchPublicSiteDetail } from "@/presentation/sites/data/siteDetailFetchers";
import { getSiteOpenStatus } from "@/presentation/sites/lib/openStatus";
import { publicTeam } from "@/domain/entities/events/publicCredits";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { SessionViewModelMapper } from "@/presentation/events/mapper/SessionViewModelMapper";
import { EventDetailClient } from "./EventDetailClient";
import type { LinkedSiteInfo } from "./detail/EventPlace";
import {
  fetchEventDetailById,
  fetchEventDetailBySlug,
  fetchEventSessions,
} from "../data/eventDetailFetchers";

interface SessionDetailContainerProps {
  /** Slug o id del evento padre. */
  eventId: string;
  /** Slug o id de la sesión, tal como viene en la URL. */
  sessionRef: string;
}

/**
 * Detalle público de una sesión. Vive fuera de `page.tsx` para poder leerse
 * dentro del <Suspense> de `ServerBoundary`. Igual para todos (cacheable en el CDN): lo de la persona
 * (like, inscripción a esta fecha, dueño, equipo) lo pide el cliente a /api/events/[id]/viewer.
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

  const parentVM = { ...EventViewModelMapper.toViewModel(parent), ...publicTeam(parent.collaborators, parent.collaboratorsData) };
  const sessionVM = SessionViewModelMapper.toViewModel(
    session,
    parentVM.mainImage?.url,
    sessions,
  );
  const mergedVM = SessionViewModelMapper.toEventViewModel(sessionVM, parentVM);

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

  const parentRef = parent.slug || parent.id;

  return (
    <EventDetailClient
      event={mergedVM}
      shareUrl={`/eventos/${parentRef}/sessions/${session.slug || session.id}`}
      backLink={{ href: `/eventos/${parentRef}`, label: parent.title }}
      editSessionHref={`/eventos/${parent.id}/edit?step=sessions`}
      sessionId={session.id}
      linkedSite={linkedSite}
    />
  );
}
