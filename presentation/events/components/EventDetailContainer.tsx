import { notFound } from "next/navigation";
import { fetchPublicSiteDetail } from "@/presentation/sites/data/siteDetailFetchers";
import { getSiteOpenStatus } from "@/presentation/sites/lib/openStatus";
import { after } from "next/server";
import { createServerContainer } from "@/infraestructure/di/container";
import { publicTeam } from "@/domain/entities/events/publicCredits";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import { SessionViewModelMapper } from "../mapper/SessionViewModelMapper";
import { EventDetailClient, type TeamViewerRole } from "./EventDetailClient";
import type { LinkedSiteInfo } from "./detail/EventPlace";
import { MultiDateEventDetailClient } from "./MultiDateEventDetailClient";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { getEventAccess } from "@/app/actions/_session";
import { recordEventView } from "@/app/actions/events/_recordEventView";
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

  // El personal interno (lector / control de acceso) no viaja al cliente en la página pública.
  const viewModel = { ...EventViewModelMapper.toViewModel(event), ...publicTeam(event.collaborators, event.collaboratorsData) };

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

  // Rol de equipo (editor/lector/control de acceso) para el acceso a Studio. Lectura sin caché, solo si hay sesión.
  const teamRole = !isOwner && userId ? ((await getEventAccess(event.id))?.role as TeamViewerRole | undefined) : undefined;

  // Registrar vista del evento (misma lógica para standard y multi-date).
  after(async () => {
    await recordEventView(event.id, userId);
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
        teamRole={teamRole}
      />
    );
  }

  // El acceso al Estudio es solo para dueños con plan Premium; los demás
  // dueños ven un modal sencillo con sus inscritos.
  let isPremiumOwner = false;
  if (isOwner && userId) {
    const { userService } = createServerContainer();
    const owner = await userService.getUserById(userId);
    isPremiumOwner = owner?.plan === "premium";
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
    <EventDetailClient
      event={viewModel}
      initialLiked={initialLiked}
      initialRegistered={initialRegistered}
      isOwner={isOwner}
      teamRole={teamRole}
      isPremiumOwner={isPremiumOwner}
      linkedSite={linkedSite}
    />
  );
};
