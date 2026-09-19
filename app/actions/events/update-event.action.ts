"use server";

import {
  FormEventSchema,
  FormEventDto,
} from "@/application/dto/events/EventDto";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { getTokens } from "next-firebase-auth-edge";
import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { safeParse } from "valibot";
import { moderationFieldsForSubmission } from "./lib/eventModerationPolicy";

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

  const { eventsService, userService } = createServerContainer();
  const [existingEvent, author] = await Promise.all([
    eventsService.getEventById(eventId),
    userService.getUserById(userId),
  ]);

  if (!existingEvent || existingEvent.author.id !== userId) {
    return { success: false, error: "No tienes permiso para actualizar este evento." };
  }

  if (!author) {
    return { success: false, error: "No encontramos tu perfil de usuario." };
  }

  const resultParse = safeParse(FormEventSchema, {
    ...event,
    id: eventId,
    author: {
      id: tokens.decodedToken.uid,
      displayName: tokens.decodedToken.name || "pruebas evento",
      photoURL: tokens.decodedToken.picture,
    },
    promotion: {
      isPromoted: event.promotion?.isPromoted ?? false,
      promotedAt: event.promotion?.promotedAt ?? null,
      promotedUntil: event.promotion?.promotedUntil ?? null,
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
      error: resultParse.issues.map((issue) => issue.message).join(", "),
    };
  }

  const parsedData = EventViewModelMapper.toDomain(
    resultParse.output as unknown as EventViewModel,
  );

  const updatedEvent = {
    ...existingEvent,
    ...parsedData,
    id: eventId,
    author: existingEvent.author,
  };

  if (existingEvent.status === "published" || parsedData.status === "published") {
    Object.assign(updatedEvent, moderationFieldsForSubmission(author));
  } else {
    updatedEvent.moderationStatus = existingEvent.moderationStatus;
    updatedEvent.moderationMode = existingEvent.moderationMode;
    updatedEvent.rejectionReason = existingEvent.rejectionReason;
    updatedEvent.submittedAt = existingEvent.submittedAt;
    updatedEvent.reviewedAt = existingEvent.reviewedAt;
    updatedEvent.reviewedBy = existingEvent.reviewedBy;
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
    updateTag(`user-events-${userId}`);
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
