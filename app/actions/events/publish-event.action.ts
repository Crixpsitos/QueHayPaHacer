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
import { filterStandardClaims } from "next-firebase-auth-edge/auth/claims";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { toSlug } from "@/app/lib/utils/slug";
import { safeParse } from "valibot";
import { syncEventDateRange } from "./lib/syncEventDateRange";

type PublishEventActionResult =
  | {
      success: true;
      eventId: string;
      slug: string;
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

  // Multi-fecha es exclusivo de cuentas profesionales.
  if (
    event.eventType === "multi-date" &&
    filterStandardClaims(tokens.decodedToken).role !== "professional"
  ) {
    return {
      success: false,
      error: "Los eventos multi-fecha son exclusivos de cuentas profesionales.",
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
  if (event.eventType === "multi-date" && event.id) {
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
    event.eventType === "multi-date"
      ? publishEventMultiDateSchema
      : publishEventSchema;

  const resultParse = safeParse(schema, {
    ...event,
    id: event.id,
    slug: event.slug ||
      (event.title
        ? `${toSlug(event.title)}-${Date.now().toString(36)}`
        : undefined),
    status: "published",
    publishedAt: new Date().toISOString(),
    eventType: event.eventType,
    author: {
      id: tokens.decodedToken.uid,
      displayName: tokens.decodedToken.name || "pruebas evento",
      photoURL: tokens.decodedToken.picture,
    },
  });

  if (!resultParse.success) {
    console.error(
      "Error updating event:",
      JSON.stringify(resultParse.issues, null, 3),
    );
    console.log(
      "esto fue lo que recibi",
      JSON.stringify(resultParse.output, null, 3),
    );
    return {
      success: false,
      error: "No se pudo publicar el evento. Por favor verifica los datos.",
    };
  }

  const parsedData = EventViewModelMapper.toDomain(
    resultParse.output as unknown as EventViewModel,
  );
  const userId = tokens.decodedToken.uid;

  try {
    const { eventsService, badgeService, profileService, userService } = createServerContainer();

    const author = await userService.getUserById(userId);

    // Detectar primer evento ANTES de publicar para setear metadata.isFirstEvent
    const existingEvents = await profileService.getUserEvents(userId);
    const hasOtherPublished = existingEvents.some((e) => e.status === "published");
    if (!hasOtherPublished) {
      parsedData.metadata = { ...parsedData.metadata, isFirstEvent: true };
    }

    const publishedEvent = await eventsService.publishEvent(parsedData, {
      isProfessionalAuthor: author?.accountType === "professional",
    });

    // Multi-date: el evento no guarda fechas propias → derivarlas de las sesiones
    // (min inicio / max fin) para que aparezca en los listados por fecha.
    if (event.eventType === "multi-date") {
      await syncEventDateRange(publishedEvent.id || parsedData.id);
    }

    // Asignar insignia de "Primer Evento" si es el primer evento publicado
    try {
      if (!hasOtherPublished) {
        await badgeService.awardBadgeToUser(
          userId,
          "first-event",
          "Publicaste tu primer evento"
        );
        revalidateTag(`profile-badges-${userId}`, "max");
        revalidateTag(`profile-stats-${userId}`, "max");
      }
    } catch (badgeError) {
      console.error(`[BADGE ERROR] No se pudo asignar insignia de primer evento:`, badgeError);
    }

    updateTag("event-list");
    updateTag(`user-events-${userId}`);
    revalidateTag("explore", "max");

    // revalidateTag (stale-while-revalidate) para las pestanas de Eventos y stats del perfil
    revalidateTag(`profile-events-${userId}`, "max");
    revalidateTag(`profile-stats-${userId}`, "max");

    revalidatePath("/", "page");
    revalidatePath("/eventos", "layout");
    revalidatePath("/profile/events", "layout");
    return { success: true, eventId: publishedEvent.id || parsedData.id, slug: publishedEvent.slug || parsedData.slug || publishedEvent.id || parsedData.id };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error: "No se pudo actualizar el evento. Intenta nuevamente.",
    };
  }
}
