"use server";

import {
  FormEventSchema,
  FormEventDto,
  publishEventSchema,
  publishEventMultiDateSchema,
} from "@/application/dto/events/EventDto";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { getTokens } from "next-firebase-auth-edge";
import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { safeParse } from "valibot";
import { requireEventPermission } from "@/app/actions/_session";
import { applyTeamPolicy, invalidateTeamAccess } from "./lib/teamPolicy";
import { enforcePlanFeatures, moderationFieldsForSubmission, withServerOwnedFields } from "./lib/eventModerationPolicy";

interface UpdateEventActionResult {
  success?: boolean;
  error?: string;
}

export async function updateEventAction(
  eventId: string,
  event: Omit<FormEventDto, "id">,
): Promise<UpdateEventActionResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;
  if (!userId) {
    return {
      success: false,
      error: "Debes iniciar sesion para crear un evento.",
    };
  }

  if (!tokens.decodedToken.email_verified) {
    return {
      success: false,
      error: "Debes verificar tu correo electrónico antes de actualizar un evento.",
    };
  }

  // Dueño (sin exigir Premium, como siempre) o editor mientras el dueño siga Premium.
  const access = await requireEventPermission(eventId, "edit_event", { ownerNeedsPremium: false });
  if (!access) {
    return { success: false, error: "No tienes permiso para actualizar este evento." };
  }

  const { eventsService, userService } = createServerContainer();
  // `author` = el DUEÑO (moderación y plan salen de su perfil, no del editor).
  const [existingEvent, author] = await Promise.all([
    eventsService.getEventById(eventId),
    userService.getUserById(access.ownerId),
  ]);

  if (!existingEvent || existingEvent.author.id !== access.ownerId) {
    return { success: false, error: "No tienes permiso para actualizar este evento." };
  }

  if (!author) {
    return { success: false, error: "No encontramos el perfil del organizador." };
  }

  // author/slug/promotion/status son del servidor (withServerOwnedFields abajo).
  const input = {
    ...event,
    id: eventId,
    slug: undefined,
    // Solo para pasar el schema: withServerOwnedFields conserva el author guardado.
    author: {
      id: access.ownerId,
      displayName: author.displayName || existingEvent.author.displayName,
      photoURL: undefined,
    },
  };
  const resultParse = safeParse(FormEventSchema, input);

  if (!resultParse.success) {
    console.error(
      "Error updating event:",
      JSON.stringify(resultParse.issues, null, 3),
    );
    return {
      success: false,
      error: resultParse.issues.map((issue) => issue.message).join(", "),
    };
  }

  // Un evento publicado/en revisión no puede quedar con datos que no pasarían
  // la validación de publicación.
  if (existingEvent.status === "published" || existingEvent.status === "pending") {
    const publishParse = safeParse(
      existingEvent.eventType === "multi-date"
        ? publishEventMultiDateSchema
        : publishEventSchema,
      {
        ...input,
        slug: existingEvent.slug,
        status: existingEvent.status,
        publishedAt: new Date().toISOString(),
      },
    );
    if (!publishParse.success) {
      return { success: false, error: publishParse.issues[0].message };
    }
  }

  const parsedData = EventViewModelMapper.toDomain(
    resultParse.output as unknown as EventViewModel,
  );

  // El cliente no cambia tipo (multi-fecha es Premium), estado, moderación,
  // promoción ni analytics: se conservan los del evento guardado.
  const { event: withTeam, changedUids } = await applyTeamPolicy(
    withServerOwnedFields(existingEvent, parsedData),
    existingEvent,
    access.role,
    access.ownerId,
  );
  const updatedEvent = enforcePlanFeatures(withTeam, author);

  if (existingEvent.status === "published") {
    Object.assign(updatedEvent, moderationFieldsForSubmission(author));
  }

  try {
    await eventsService.updateEvent(updatedEvent);

    if (existingEvent.status === "published" || updatedEvent.status === "published") {
      updateTag("event-list");

      revalidatePath("/", "page");
      revalidatePath("/eventos", "page");
    }
    revalidatePath(`/eventos/${eventId}`, "page");
    updateTag(`event-${eventId}`);
    invalidateTeamAccess(changedUids);
    updateTag(`profile-events-${access.ownerId}`);
    updateTag(`profile-stats-${access.ownerId}`);
    revalidatePath("/profile/events", "page");

    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error: "No se pudo actualizar el evento. Intenta nuevamente.",
    };
  }
}
