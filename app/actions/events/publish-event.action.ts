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
import { revalidatePath, updateTag } from "next/cache";
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
    const { eventsService } = createServerContainer();
    const publishedEvent = await eventsService.publishEvent(parsedData);

    updateTag("event-list");
    updateTag(`user-events-${userId}`);
    
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
