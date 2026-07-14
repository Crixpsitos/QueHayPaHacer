"use server";

import {
  FormEventDto,
  FormEventSchema,
} from "@/application/dto/events/EventDto";
import { Events } from "@/domain/entities/events/Events";
import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { getTokens } from "next-firebase-auth-edge";
import { filterStandardClaims } from "next-firebase-auth-edge/auth/claims";
import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { toSlug } from "@/app/lib/utils/slug";
import { safeParse } from "valibot";

interface CreateDraftEventActionResult {
  success?: boolean;
  eventInfo?: EventViewModel;
  error?: string;
}

export async function createDraftEventAction(
  event: FormEventDto,
): Promise<CreateDraftEventActionResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return {
      success: false,
      error: "Debes iniciar sesion para crear un evento.",
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

  console.log("probandooooo", event)

  const resultParse = safeParse(FormEventSchema, {
    ...event,
    slug: event.title
      ? `${toSlug(event.title)}-${Date.now().toString(36)}`
      : undefined,
    author: {
      id: tokens.decodedToken.uid,
      displayName: tokens.decodedToken.name ?? "pruebas evento",
      photoURL: tokens.decodedToken.picture || undefined,
    },
  });

  if (!resultParse.success) {
    console.error(
      "Validation issues:",
      resultParse.issues.map((i) => ({
        path: i.path?.map((p) => p.key).join("."),
        message: i.message,
        received: i.input,
      })),
    );

    console.log("probandooooo")

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
    const event = await eventsService.createDraftEvent(
      parsedData as unknown as Partial<Events>,
    );

    const eventViewModel = EventViewModelMapper.toViewModel(event);
    const userId = tokens.decodedToken.uid;

    updateTag(`user-events-${userId}`);
    revalidatePath("/profile/events", "layout");
    return { success: true, eventInfo: eventViewModel };
  } catch (error) {
    console.error("Error creating draft event:", error);
    return {
      success: false,
      error: "No se pudo crear el evento. Intenta nuevamente.",
    };
  }
}
