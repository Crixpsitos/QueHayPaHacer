"use server";

import {
  FormEventDto,
  publishEventSchema,
  publishEventMultiDateSchema,
} from "@/application/dto/events/EventDto";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { getTokens } from "next-firebase-auth-edge";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { toSlug } from "@/app/lib/utils/slug";
import { safeParse } from "valibot";
import { syncEventDateRange } from "./lib/syncEventDateRange";
import { syncEventSiteIds } from "./lib/syncEventSiteIds";
import { refreshSitesOfEvent } from "./lib/refreshSites";
import { siteLinkError } from "./lib/siteLink";
import { linkedSiteIds, notifySiteAuthorsOfEvent } from "@/app/lib/sites/siteEvents";
import { DECLARATION_ERROR, hasDeclared } from "@/app/lib/legal/declaration";
import { requireEventPermission } from "@/app/actions/_session";
import { applyTeamPolicy, invalidateTeamAccess } from "./lib/teamPolicy";
import { enforcePlanFeatures, moderationFieldsForSubmission, withServerOwnedFields } from "./lib/eventModerationPolicy";

type PublishEventActionResult =
  | {
      success: true;
      eventId: string;
      slug: string;
      status: "pending" | "published";
      moderationStatus: "pending" | "pending_audit";
      error?: never;
    }
  | {
      success: false;
      error: string;
    };

/**
 * `declaration` (declaración del autor) es obligatoria en TODA publicación, incluida
 * la republicación/edición de un evento ya publicado (reafirma la responsabilidad
 * sobre el contenido editado). Los borradores no pasan por aquí. Las sesiones
 * multi-fecha se publican a través del evento.
 */
export async function publishEventAction(
  event: FormEventDto,
  declaration: boolean,
): Promise<PublishEventActionResult> {
  if (!hasDeclared(declaration)) {
    return { success: false, error: DECLARATION_ERROR };
  }
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return {
      success: false,
      error: "Debes iniciar sesion para crear un evento.",
    };
  }

  if (!tokens.decodedToken.email_verified) {
    return {
      success: false,
      error: "Debes verificar tu correo electrónico antes de publicar un evento.",
    };
  }

  const { eventsService, profileService, userService, contentDeclarationService } = createServerContainer();
  const actorUid = tokens.decodedToken.uid;
  const existingEvent = event.id ? await eventsService.getEventById(event.id) : null;
  if (event.id && !existingEvent) {
    return { success: false, error: "No tienes permiso para publicar este evento." };
  }
  // Evento existente: dueño (sin exigir Premium, como siempre) o editor mientras el dueño siga Premium.
  const access = event.id
    ? await requireEventPermission(event.id, "publish_event", { ownerNeedsPremium: false })
    : null;
  if (event.id && !access) {
    return { success: false, error: "No tienes permiso para publicar este evento." };
  }
  // `author` = el DUEÑO del evento (plan y moderación salen de su perfil); quien publica (actor) firma la declaración.
  const ownerId = access?.ownerId ?? actorUid;
  const author = await userService.getUserById(ownerId);

  if (!author) {
    return { success: false, error: "No encontramos el perfil del organizador." };
  }

  // El tipo guardado manda: el cliente no puede cambiarlo al publicar.
  const eventType = existingEvent ? existingEvent.eventType : event.eventType;

  // Vínculo con un sitio: solo a uno propio del DUEÑO (publicado como dueño y aprobado), y solo si es nuevo o cambia.
  const linkError = await siteLinkError(ownerId, event.location?.siteId, existingEvent?.location?.siteId);
  if (linkError) return { success: false, error: linkError };

  // Multi-fecha es exclusivo del plan Premium.
  if (
    eventType === "multi-date" &&
    author?.plan !== "premium"
  ) {
    return {
      success: false,
      error: "Los eventos multi-fecha son exclusivos del plan Premium.",
    };
  }

  // Ensure mainImage is present server-side (safety net beyond schema)
  if (!event?.mainImage || !event.mainImage?.url) {
    return {
      success: false,
      error: "La imagen principal es obligatoria para publicar.",
    };
  }

  // Multi-date: no se puede publicar el evento si alguna sesión sigue en borrador.
  if (eventType === "multi-date" && event.id) {
    const { eventSessionService } = createServerContainer();
    const sessions = await eventSessionService.getByEventId(event.id);
    if (sessions.length === 0) {
      return {
        success: false,
        error: "Agrega al menos una sesión (fecha) antes de publicar el evento.",
      };
    }
    const draft = sessions.find((s) => s.status === "draft");
    if (draft) {
      return {
        success: false,
        error: `Hemos encontrado que una de las fechas de tu evento${draft.title ? ` ("${draft.title}")` : ""} está como borrador. Bórrala o publícala para poder continuar.`,
      };
    }
  }

  // Multi-fecha valida solo el encabezado (v.object recorta location/fechas/precio).
  const schema =
    eventType === "multi-date"
      ? publishEventMultiDateSchema
      : publishEventSchema;

  const resultParse = safeParse(schema, {
    ...event,
    id: event.id,
    // slug/promoción/fechas de sistema no se aceptan del cliente.
    slug: existingEvent?.slug ||
      (event.title
        ? `${toSlug(event.title)}-${Date.now().toString(36)}`
        : undefined),
    promotion: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    status: "published",
    publishedAt: new Date().toISOString(),
    eventType,
    author: {
      id: ownerId,
      displayName: author.displayName || (ownerId === actorUid ? tokens.decodedToken.name : "") || "",
      photoURL: author.photoURL || (ownerId === actorUid ? tokens.decodedToken.picture : undefined) || undefined,
    },
  });

  if (!resultParse.success) {
    console.error(
      "Error updating event:",
      JSON.stringify(resultParse.issues, null, 3),
    );
    return {
      success: false,
      error:
        resultParse.issues[0]?.message ??
        "No se pudo publicar el evento. Por favor verifica los datos.",
    };
  }

  const domainData = EventViewModelMapper.toDomain(
    resultParse.output as unknown as EventViewModel,
  );
  // Republicar conserva analytics (score), promoción, createdAt, metadata, autor.
  const { event: withTeam, changedUids } = await applyTeamPolicy(
    existingEvent ? withServerOwnedFields(existingEvent, domainData) : domainData,
    existingEvent,
    access?.role ?? "owner",
    ownerId,
  );
  const parsedData = enforcePlanFeatures(withTeam, author);
  // userId = dueño (tags de perfil, "primer evento"); el actor solo firma la declaración.
  const userId = ownerId;
  Object.assign(parsedData, moderationFieldsForSubmission(author));

  try {
    // Detectar primer evento ANTES de publicar para setear metadata.isFirstEvent
    const existingEvents = await profileService.getUserEvents(userId);
    const hasOtherPublished = existingEvents.some((e) => e.status === "published");
    if (!hasOtherPublished) {
      parsedData.metadata = { ...parsedData.metadata, isFirstEvent: true };
    }

    // Evidencia ANTES de publicar: si falla, se aborta y no se publica. Solo cuando
    // el evento aún no tiene id (se crea al publicar) se escribe después y, si falla,
    // se borra el evento recién creado para no dejar contenido publicado sin evidencia.
    if (parsedData.id) {
      await contentDeclarationService.record(actorUid, "event", parsedData.id);
    }
    const sitesBefore = await linkedSiteIds(existingEvent);
    const publishedEvent = await eventsService.publishEvent(parsedData, {
      isPremiumAuthor: author?.plan === "premium",
    });
    if (!parsedData.id) {
      try {
        await contentDeclarationService.record(actorUid, "event", publishedEvent.id);
      } catch (e) {
        await eventsService.deleteEvent(publishedEvent.id).catch(() => {});
        throw e;
      }
    }

    // Multi-date: el evento no guarda fechas propias → derivarlas de las sesiones
    // (min inicio / max fin) para que aparezca en los listados por fecha.
    if (eventType === "multi-date") {
      await syncEventDateRange(publishedEvent.id || parsedData.id);
      await syncEventSiteIds(publishedEvent.id || parsedData.id);
    }

    // Agenda del sitio: recuenta los sitios vinculados antes y ahora; y avisa a su autor si el evento ya quedó público
    // (autores verificados publican de inmediato; el resto entra por moderación y avisa el webhook al aprobar).
    const finalId = publishedEvent.id || parsedData.id;
    await refreshSitesOfEvent([...sitesBefore, ...(await linkedSiteIds({ ...parsedData, id: finalId }))]);
    if (parsedData.status === "published") {
      await notifySiteAuthorsOfEvent({ ...parsedData, id: finalId, title: parsedData.title, author: parsedData.author });
    }

    invalidateTeamAccess(changedUids);
    updateTag("event-list");
    updateTag(`event-${publishedEvent.id || parsedData.id}`);
    updateTag(`profile-events-${userId}`);
    updateTag(`profile-stats-${userId}`);
    revalidateTag("explore", "max");

    // revalidateTag (stale-while-revalidate) para las pestanas de Eventos y stats del perfil
    revalidateTag(`profile-events-${userId}`, "max");
    revalidateTag(`profile-stats-${userId}`, "max");

    revalidatePath("/", "page");
    revalidatePath("/eventos", "layout");
    revalidatePath("/profile/events", "layout");
    return {
      success: true,
      eventId: publishedEvent.id || parsedData.id,
      slug: publishedEvent.slug || parsedData.slug || publishedEvent.id || parsedData.id,
      status: parsedData.status as "pending" | "published",
      moderationStatus: parsedData.moderationStatus as "pending" | "pending_audit",
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error: "No se pudo actualizar el evento. Intenta nuevamente.",
    };
  }
}
