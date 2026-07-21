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

  try {
    const { eventsService } = createServerContainer();
    await eventsService.updateEvent(parsedData);

    if (parsedData.status === "published") {
      updateTag("event-list");

      revalidatePath("/", "page");
      revalidatePath("/eventos", "page");
      revalidatePath(`/eventos/${eventId}`, "page");
    }
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
