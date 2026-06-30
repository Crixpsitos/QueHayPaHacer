"use server";

import {
  FormEventDto,
  publishEventSchema,
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

  // Ensure mainImage is present server-side (safety net beyond schema)
  if (!event?.mainImage || !event.mainImage?.url) {
    return {
      success: false,
      error: "La imagen principal es obligatoria para publicar.",
    };
  }

  const resultParse = safeParse(publishEventSchema, {
    ...event,
    id: event.id,
    slug: event.slug ||
      (event.title
        ? `${toSlug(event.title)}-${Date.now().toString(36)}`
        : undefined),
    status: "published",
    publishedAt: new Date().toISOString(),
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
    const publishedEvent = await eventsService.publishEvent(parsedData, {
      isProfessionalAuthor: author?.accountType === "professional",
    });

    // Asignar insignia de "Primer Evento" si es el primer evento publicado
    try {
      const userEvents = await profileService.getUserEvents(userId);
      console.log(`[BADGE DEBUG] Usuario ${userId} tiene ${userEvents.length} eventos totales`);
      
      const publishedEvents = userEvents.filter((e) => e.status === "published");
      console.log(`[BADGE DEBUG] Eventos publicados: ${publishedEvents.length}`);
      console.log(`[BADGE DEBUG] IDs: ${publishedEvents.map(e => e.id).join(", ")}`);
      console.log(`[BADGE DEBUG] Evento recién publicado ID: ${publishedEvent.id}`);

      // Contar eventos publicados EXCLUYENDO el que acabamos de crear
      const otherPublishedEvents = userEvents.filter(
        (e) => e.status === "published" && e.id !== publishedEvent.id
      );
      
      console.log(`[BADGE DEBUG] Otros eventos publicados (sin el actual): ${otherPublishedEvents.length}`);

      if (otherPublishedEvents.length === 0) {
        console.log(`[BADGE DEBUG] ✅ Es el PRIMER evento, asignando badge...`);
        await badgeService.awardBadgeToUser(
          userId,
          "first-event",
          "Publicaste tu primer evento"
        );
        console.log(`[BADGE DEBUG] ✅ Badge asignado exitosamente`);
        revalidateTag(`profile-badges-${userId}`, "max");
        revalidateTag(`profile-stats-${userId}`, "max");
      } else {
        console.log(`[BADGE DEBUG] ❌ NO es el primer evento, usuario ya tiene ${otherPublishedEvents.length} publicados`);
      }
    } catch (badgeError) {
      console.error(`[BADGE ERROR] No se pudo asignar insignia de primer evento:`, badgeError);
    }

    updateTag("event-list");
    updateTag(`user-events-${userId}`);

    // revalidateTag (stale-while-revalidate) para las pestanas de Eventos y stats del perfil
    revalidateTag(`profile-events-${userId}`, "max");
    revalidateTag(`profile-stats-${userId}`, "max");

    revalidatePath("/", "page");
    revalidatePath("/events", "layout");
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
