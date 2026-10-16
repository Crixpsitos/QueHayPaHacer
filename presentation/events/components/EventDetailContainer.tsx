import { notFound } from "next/navigation";
import { fetchPublicSiteDetail } from "@/presentation/sites/data/siteDetailFetchers";
import { getSiteOpenStatus } from "@/presentation/sites/lib/openStatus";
import { publicTeam } from "@/domain/entities/events/publicCredits";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { SessionViewModelMapper } from "../mapper/SessionViewModelMapper";
import { EventDetailClient } from "./EventDetailClient";
import type { LinkedSiteInfo } from "./detail/EventPlace";
import { MultiDateEventDetailClient } from "./MultiDateEventDetailClient";
import {
  fetchEventDetailById,
  fetchEventDetailBySlug,
  fetchEventSessions,
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

  // El personal interno (lector / control de acceso) no viaja al cliente en la página pública.
  const viewModel = { ...EventViewModelMapper.toViewModel(event), ...publicTeam(event.collaborators, event.collaboratorsData) };

  // ── Multi-date: layout con lista de sesiones ──
  if (event.eventType === "multi-date") {
    const sessions = await fetchEventSessions(event.id);
    // Portadas se resuelven contra TODAS las sesiones ({ sessionId } refs). La página es pública y se cachea
    // igual para todos: solo fechas publicadas (el dueño edita los borradores en el editor).
    const sessionVMs = SessionViewModelMapper.toViewModels(
      sessions,
      viewModel.mainImage?.url,
    ).filter((s) => s.status === "published");

    return <MultiDateEventDetailClient event={viewModel} sessions={sessionVMs} />;
  }

  // Sitio vinculado (si el evento tiene location.siteId)
  let linkedSite: LinkedSiteInfo | undefined;
  const siteId = event.location?.siteId;
  if (siteId) {
    // Solo sitios públicos (no borradores/rechazados), cacheado y con hora de Colombia.
    const site = await fetchPublicSiteDetail(siteId);
    if (site) {
      const { isOpen, label } = getSiteOpenStatus(site.schedule);
      linkedSite = { id: site.id, slug: site.slug, name: site.name, category: site.category, address: site.address, coverUrl: site.coverUrl, isOpen, openLabel: label ?? "Horario no disponible" };
    }
  }

  return (
    <EventDetailClient event={viewModel} linkedSite={linkedSite} />
  );
};
