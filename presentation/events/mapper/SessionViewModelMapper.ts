import type { EventSession } from "@/domain/entities/events/EventSession";
import type { SessionViewModel } from "../view-models/SessionViewModel";
import type { EventViewModel } from "../view-models/EventViewModel";

/** Resuelve la portada de una sesión según su `coverSource`. */
function resolveCoverUrl(
  session: EventSession,
  parentCoverUrl?: string,
  allSessions?: EventSession[],
): string | undefined {
  if (session.coverSource === "parent") return parentCoverUrl;
  if (session.coverSource === "own") return session.mainImage?.url;
  if (typeof session.coverSource === "object" && "sessionId" in session.coverSource) {
    const refId = session.coverSource.sessionId;
    const ref = allSessions?.find((s) => s.id === refId);
    return ref?.mainImage?.url;
  }
  return undefined;
}

export class SessionViewModelMapper {
  static toViewModel(
    session: EventSession,
    parentCoverUrl?: string,
    allSessions?: EventSession[],
  ): SessionViewModel {
    return {
      id: session.id,
      eventId: session.eventId,
      slug: session.slug,
      title: session.title ?? "",
      shortDescription: session.shortDescription ?? "",
      description: session.description,
      coverUrl: resolveCoverUrl(session, parentCoverUrl, allSessions),
      media: session.media ?? [],
      location: session.location,
      startDate: new Date(session.startDate).toISOString(),
      endDate: new Date(session.endDate).toISOString(),
      registrationType: session.registrationType,
      externalUrl: session.externalUrl,
      capacity: session.capacity,
      requiresAttendance: session.requiresAttendance,
      registrationEventForm: session.registrationEventForm,
      price: session.price,
      status: session.status,
      analytics: session.analytics,
    };
  }

  static toViewModels(
    sessions: EventSession[],
    parentCoverUrl?: string,
  ): SessionViewModel[] {
    // Resuelve portadas contra la lista completa (referencias { sessionId }).
    return sessions.map((s) => this.toViewModel(s, parentCoverUrl, sessions));
  }

  /**
   * Fusiona una sesión con su evento padre para reutilizar el detalle estándar
   * (`EventDetailClient`). La sesión aporta lugar, fechas, precio y registro; el
   * padre aporta autor, categoría, promoción y analíticas.
   *
   * ponytail: `id` = id del evento padre a propósito — like/registro/analíticas
   * viven solo en el evento (las sesiones no tienen infra propia). Ceiling: si se
   * necesita registro por-sesión, crear infra de registro con sessionId.
   */
  static toEventViewModel(
    session: SessionViewModel,
    parent: EventViewModel,
  ): EventViewModel {
    return {
      ...parent,
      title: session.title || parent.title,
      shortDescription: session.shortDescription || parent.shortDescription,
      description: (session.description ?? parent.description) as EventViewModel["description"],
      mainImage: session.coverUrl
        ? { url: session.coverUrl }
        : parent.mainImage,
      media: session.media.length > 0 ? session.media : parent.media,
      location: session.location,
      registrationType: session.registrationType,
      registrationEventForm: session.registrationEventForm as EventViewModel["registrationEventForm"],
      externalUrl: session.externalUrl,
      capacity: session.capacity,
      requiresAttendance: session.requiresAttendance,
      price: session.price,
      status: session.status,
      eventType: "standard", // fuerza el layout estándar del detalle
      // `likes` y `score` son del PADRE: el like es del evento (el corazón de una
      // fecha contaría a la misma persona dos veces). `views`/`registrations`/
      // `shares` sí son de la sesión: son acciones y pasan por fecha.
      analytics: {
        ...parent.analytics,
        views: session.analytics?.views ?? 0,
        registrations: session.analytics?.registrations ?? 0,
        shares: session.analytics?.shares ?? 0,
      },
      startDate: session.startDate,
      endDate: session.endDate,
    };
  }
}
