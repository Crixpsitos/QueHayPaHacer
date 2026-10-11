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
import { moderationFieldsForSubmission, withServerOwnedFields } from "./lib/eventModerationPolicy";

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

export async function publishEventAction(
  event: FormEventDto,
): Promise<PublishEventActionResult> {
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

  const { eventsService, profileService, userService } = createServerContainer();
  const author = await userService.getUserById(tokens.decodedToken.uid);

  if (!author) {
    return { success: false, error: "No encontramos tu perfil de usuario." };
  }

  const existingEvent = event.id ? await eventsService.getEventById(event.id) : null;
  if (event.id && (!existingEvent || existingEvent.author.id !== author.uid)) {
    return { success: false, error: "No tienes permiso para publicar este evento." };
  }

  // El tipo guardado manda: el cliente no puede cambiarlo al publicar.
  const eventType = existingEvent ? existingEvent.eventType : event.eventType;

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
      id: tokens.decodedToken.uid,
      displayName: author.displayName || tokens.decodedToken.name || "",
      photoURL: author.photoURL || tokens.decodedToken.picture || undefined,
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
  const parsedData = existingEvent
    ? withServerOwnedFields(existingEvent, domainData)
    : domainData;
  const userId = tokens.decodedToken.uid;
  Object.assign(parsedData, moderationFieldsForSubmission(author));

  try {
    // Detectar primer evento ANTES de publicar para setear metadata.isFirstEvent
    const existingEvents = await profileService.getUserEvents(userId);
    const hasOtherPublished = existingEvents.some((e) => e.status === "published");
    if (!hasOtherPublished) {
      parsedData.metadata = { ...parsedData.metadata, isFirstEvent: true };
    }

    const publishedEvent = await eventsService.publishEvent(parsedData, {
      isPremiumAuthor: author?.plan === "premium",
    });

    // Multi-date: el evento no guarda fechas propias → derivarlas de las sesiones
    // (min inicio / max fin) para que aparezca en los listados por fecha.
    if (eventType === "multi-date") {
      await syncEventDateRange(publishedEvent.id || parsedData.id);
      await syncEventSiteIds(publishedEvent.id || parsedData.id);
    }

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
