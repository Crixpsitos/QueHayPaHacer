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
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
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
  const resultParse = safeParse(FormEventSchema, {
    ...event,
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

    return {
      success: false,
      error: resultParse.issues.map((issue) => issue.message).join(", "),
    };
  }

  const parsedData = EventViewModelMapper.toDomain(resultParse.output as unknown as EventViewModel);

  try {
    const { eventsService } = createServerContainer();
    const event = await eventsService.createDraftEvent(
      parsedData as unknown as Partial<Events>,
    );

    const eventViewModel = EventViewModelMapper.toViewModel(event);

    updateTag(`draft-events-${tokens.decodedToken.uid}`);
    return { success: true, eventInfo: eventViewModel };
  } catch (error) {
    console.error("Error creating draft event:", error);
    return {
      success: false,
      error: "No se pudo crear el evento. Intenta nuevamente.",
    };
  }
}
