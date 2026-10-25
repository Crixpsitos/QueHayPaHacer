"use server";

import { applyTeamPolicy, invalidateTeamAccess } from "./lib/teamPolicy";
import { enforcePlanFeatures } from "./lib/eventModerationPolicy";
import { siteLinkError } from "./lib/siteLink";
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

  // Solo a un sitio propio (publicado como dueño y aprobado): el selector ya filtra, aquí no se confía en el cliente.
  const linkError = await siteLinkError(tokens.decodedToken.uid, event.location?.siteId);
  if (linkError) return { success: false, error: linkError };

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

  // Evento nuevo: quien lo crea es el dueño; el equipo solo puede ser de su red.
  const { event: withTeam, changedUids } = await applyTeamPolicy(
    EventViewModelMapper.toDomain(resultParse.output as unknown as EventViewModel),
    null,
    "owner",
    tokens.decodedToken.uid,
  );
  const parsedData = enforcePlanFeatures(withTeam, author);

  try {
    const event = await eventsService.createDraftEvent(
      parsedData as unknown as Partial<Events>,
    );

    const eventViewModel = EventViewModelMapper.toViewModel(event);
    const userId = tokens.decodedToken.uid;

    invalidateTeamAccess(changedUids);
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
