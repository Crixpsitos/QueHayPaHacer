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
      <>
        <h1 className="sr-only">{viewModel.title}</h1>
        <MultiDateEventDetailClient
          event={viewModel}
          sessions={sessionVMs}
          initialLiked={initialLiked}
          isOwner={isOwner}
        />
      </>
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

  // Sitio vinculado (si el evento tiene location.siteId)
  let linkedSite: { id: string; slug: string; name: string; category: string; address: string; coverUrl: string; isOpen: boolean; openLabel: string } | undefined;
  const siteId = event.location?.siteId;
  if (siteId) {
    const { sitesService } = createServerContainer();
    const site = await sitesService.getSiteDetailById(siteId);
    if (site) {
      const DAY_MAP: Record<number, string> = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" };
      const now = new Date();
      const sched = (site.schedule as Record<string, { open: string; close: string; closed: boolean }>)?.[DAY_MAP[now.getDay()]];
      const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
      const cur = now.getHours() * 60 + now.getMinutes();
      const isOpen = !!(sched && !sched.closed && cur >= toMins(sched.open) && cur < toMins(sched.close));
      const openLabel = !sched ? "Horario no disponible" : sched.closed ? "Cerrado hoy" : isOpen ? `Abierto · Cierra ${sched.close}` : `Cerrado · Abre ${sched.open}`;
      linkedSite = { id: site.id, slug: site.slug, name: site.name, category: site.category, address: site.address, coverUrl: site.coverUrl, isOpen, openLabel };
    }
  }

  return (
    <>
      <h1 className="sr-only">{viewModel.title}</h1>
      <EventDetailClient
        event={viewModel}
        initialLiked={initialLiked}
        initialRegistered={initialRegistered}
        isOwner={isOwner}
        isProfessionalOwner={isProfessionalOwner}
        linkedSite={linkedSite}
      />
    </>
  );
};
