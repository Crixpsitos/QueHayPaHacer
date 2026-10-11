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

  const { eventsService, userService } = createServerContainer();
  const author = await userService.getUserById(tokens.decodedToken.uid);

  // Multi-fecha es exclusivo del plan Premium.
  if (
    event.eventType === "multi-date" &&
    author?.plan !== "premium"
  ) {
    return {
      success: false,
      error: "Los eventos multi-fecha son exclusivos del plan Premium.",
    };
  }

  const resultParse = safeParse(FormEventSchema, {
    ...event,
    slug: event.title
      ? `${toSlug(event.title)}-${Date.now().toString(36)}`
      : undefined,
    // Server-owned: siempre nace borrador (publicar pasa por moderación en
    // publishEventAction) y sin promoción (no hay flujo de pago).
    status: "draft",
    promotion: undefined,
    author: {
      id: tokens.decodedToken.uid,
      displayName: author?.displayName || tokens.decodedToken.name || "",
      photoURL: author?.photoURL || tokens.decodedToken.picture || undefined,
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

  const parsedData = EventViewModelMapper.toDomain(
    resultParse.output as unknown as EventViewModel,
  );

  try {
    const event = await eventsService.createDraftEvent(
      parsedData as unknown as Partial<Events>,
    );

    const eventViewModel = EventViewModelMapper.toViewModel(event);
    const userId = tokens.decodedToken.uid;

    updateTag(`profile-events-${userId}`);
    updateTag(`profile-stats-${userId}`);
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
