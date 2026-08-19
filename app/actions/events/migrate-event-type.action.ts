"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { revalidateTag, updateTag } from "next/cache";
import { toSlug } from "@/app/lib/utils/slug";
import { syncEventDateRange } from "./lib/syncEventDateRange";
import { syncEventSiteIds } from "./lib/syncEventSiteIds";
import type { FormEventDto } from "@/application/dto/events/EventDto";
import type { Events } from "@/domain/entities/events/Events";
import type { Location } from "@/domain/entities/events/value-objects/Location";

/** Ubicación vacía compatible con el contrato de dominio. */
const DEFAULT_LOCATION: Location = {
  siteId: null,
  country: { isoCode: "", name: "", slug: "" },
  department: { isoCode: "", name: "", slug: "" },
  city: { name: "", slug: "" },
  venue: "",
  address: "",
  moreInfo: "",
  coordinates: { lat: 0, lng: 0 },
};

export type MigrateEventTypeResult =
  | { success: true; newEventId: string }
  | { success: false; error: string };

/**
 * Migración segura entre tipos de evento.
 *
 * Orden garantizado:
 * 1. Crear nuevo documento.
 * 2. Copiar sesiones si corresponde.
 * 3. Validar que el nuevo documento existe.
 * 4. Eliminar sesiones del evento anterior.
 * 5. Eliminar documento anterior.
 * 6. Devolver nuevo ID.
 *
 * Si algún paso falla ANTES de eliminar el documento original, éste permanece intacto.
 */
export async function migrateEventTypeAction(params: {
  oldEventId: string;
  targetType: "standard" | "multi-date";
  /** Estado actual del formulario (puede incluir cambios no guardados). */
  currentFormData: Partial<FormEventDto>;
  /** Solo para multi→standard: sesión cuya fecha/lugar se convierte en la principal. */
  selectedSessionId?: string;
}): Promise<MigrateEventTypeResult> {
  const { oldEventId, targetType, currentFormData, selectedSessionId } = params;

  // currentFormData llega del cliente y puede contener objetos no planos (media items
  // del snapshot de Firestore cliente, descripción TipTap con v.any(), etc.).
  // Sanitizamos SOLO los campos que pueden portar referencias cliente antes de usar
  // los datos en el servidor. JSON.parse/stringify es seguro aquí porque estos campos
  // son JSON puro por diseño (TipTap JSON, MediaItem[]); no destruye tipos como Date
  // porque el schema del formulario los almacena como strings ISO.
  const safeFormData: Partial<typeof currentFormData> = {
    ...currentFormData,
    ...(currentFormData.description !== undefined && {
      description: JSON.parse(JSON.stringify(currentFormData.description)),
    }),
    ...(currentFormData.media !== undefined && {
      media: JSON.parse(JSON.stringify(currentFormData.media)),
    }),
  };

  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;
  if (!userId) return { success: false, error: "Debes iniciar sesión." };

  const { eventsService, eventSessionService } = createServerContainer();

  // Verificar que el evento original existe y pertenece al usuario.
  const oldEvent = await eventsService.getEventById(oldEventId);
  if (!oldEvent || oldEvent.author.id !== userId) {
    return { success: false, error: "Evento no encontrado o sin permiso." };
  }
  if (oldEvent.eventType === targetType) {
    return { success: false, error: "El evento ya es del tipo solicitado." };
  }

  // Campos de encabezado del formulario actual (sin campos de sesión/específicos).
  // Usamos safeFormData (ya saneado) para reflejar los cambios que el usuario hizo en el editor.
  const {
    id: _id, slug: _slug, status: _status, publishedAt: _pa,
    analytics: _an, metadata: _meta, createdAt: _ca, updatedAt: _ua,
    // Campos de sesión que solo aplican a eventos estándar:
    startDate: _sd, endDate: _ed,
    location: _loc, registrationType: _rt, externalUrl: _eu,
    capacity: _cap, requiresAttendance: _ra, registrationEventForm: _ref,
    price: _price,
    eventType: _et,
    ...headerFormData
  } = safeFormData as Record<string, unknown>;

  try {
    let newEvent: Events;

    if (targetType === "multi-date") {
      // ── STANDARD → MULTI-DATE ──────────────────────────────────────────────
      // El nuevo documento de evento multi-fecha solo lleva campos de encabezado.
      // Las fechas/lugar/registro/precio viven en las sesiones.
      newEvent = await eventsService.createDraftEvent({
        ...(headerFormData as Partial<Events>),
        eventType: "multi-date",
        status: "draft",
        // Fechas temporales; serán actualizadas por syncEventDateRange al crear sesiones.
        startDate: oldEvent.startDate,
        endDate: oldEvent.endDate,
        slug: safeFormData.title
          ? `${toSlug(safeFormData.title as string)}-${Date.now().toString(36)}`
          : undefined,
        author: {
          id: userId,
          displayName: tokens.decodedToken.name ?? "",
          photoURL: tokens.decodedToken.picture ?? "",
        },
      } as Events);

      // Copiar sesiones que el usuario pudo haber creado en el editor multi-fecha
      // mientras el evento estaba en modo "preview" (aún persistido como estándar).
      const oldSessions = await eventSessionService.getByEventId(oldEventId);
      for (const session of oldSessions) {
        await eventSessionService.createSession({
          ...session,
          eventId: newEvent.id,
        });
      }

      // Crear la Sesión #1 con los datos temporales/de ubicación del evento estándar.
      // coverSource = "parent" → la sesión usa la portada del evento padre.
      // title/description quedan vacíos: el usuario los completa manualmente.
      {
        const MAX_SESSION_MS = 24 * 60 * 60 * 1000;

        const sessionStart =
          oldEvent.startDate instanceof Date && !isNaN(oldEvent.startDate.getTime())
            ? oldEvent.startDate
            : new Date();

        const rawEnd =
          oldEvent.endDate instanceof Date && !isNaN(oldEvent.endDate.getTime())
            ? oldEvent.endDate
            : new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);

        // Cap de 24h: si el evento estándar duraba más de 24h, la sesión
        // arranca igual pero cierra exactamente a las 24h del inicio.
        const sessionEnd =
          rawEnd.getTime() - sessionStart.getTime() > MAX_SESSION_MS
            ? new Date(sessionStart.getTime() + MAX_SESSION_MS)
            : rawEnd;

        await eventSessionService.createSession({
          eventId: newEvent.id,
          coverSource: "parent",
          media: oldEvent.media ?? [],
          location: oldEvent.location,
          startDate: sessionStart,
          endDate: sessionEnd,
          registrationType: oldEvent.registrationType ?? "none",
          externalUrl: oldEvent.externalUrl,
          capacity: oldEvent.capacity,
          requiresAttendance: oldEvent.requiresAttendance,
          registrationEventForm: oldEvent.registrationEventForm ?? { fields: [] },
          price: oldEvent.price ?? { isFree: true, amount: 0, currency: "COP" },
          status: "draft",
        });
      }

      // Sincronizar startDate/endDate del evento padre desde sus sesiones.
      await syncEventDateRange(newEvent.id);
      await syncEventSiteIds(newEvent.id);

    } else {
      // ── MULTI-DATE → STANDARD ──────────────────────────────────────────────
      const allSessions = await eventSessionService.getByEventId(oldEventId);

      // Determinar la sesión a usar como base para el evento estándar.
      // Con 0 sesiones: campos de sesión quedan vacíos (usuario los completa).
      // Con 1 sesión: usar esa automáticamente, ignorar selectedSessionId.
      // Con 2+ sesiones: usar la sesión seleccionada por el usuario.
      let chosen: (typeof allSessions)[0] | undefined;
      if (allSessions.length === 1) {
        chosen = allSessions[0];
      } else if (allSessions.length > 1) {
        if (!selectedSessionId) {
          return { success: false, error: "Debes seleccionar una sesión como fecha principal." };
        }
        chosen = allSessions.find((s) => s.id === selectedSessionId);
        if (!chosen) {
          return { success: false, error: "La sesión seleccionada no existe." };
        }
      }
      // chosen === undefined cuando hay 0 sesiones → sin campos de sesión.

      newEvent = await eventsService.createDraftEvent({
        ...(headerFormData as Partial<Events>),
        eventType: "standard",
        status: "draft",
        ...(chosen ? {
          startDate: chosen.startDate,
          endDate: chosen.endDate,
          location: chosen.location,
          registrationType: chosen.registrationType,
          externalUrl: chosen.externalUrl,
          capacity: chosen.capacity,
          requiresAttendance: chosen.requiresAttendance,
          registrationEventForm: chosen.registrationEventForm,
          price: chosen.price,
        } : {
          // Sin sesión: fecha/lugar/etc. quedan pendientes para que el usuario los complete.
          location: DEFAULT_LOCATION,
        }),
        slug: safeFormData.title
          ? `${toSlug(safeFormData.title as string)}-${Date.now().toString(36)}`
          : undefined,
        author: {
          id: userId,
          displayName: tokens.decodedToken.name ?? "",
          photoURL: tokens.decodedToken.picture ?? "",
        },
      } as Events);
    }

    // Validar que el nuevo documento fue creado correctamente antes de eliminar el anterior.
    const validated = await eventsService.getEventById(newEvent.id);
    if (!validated) {
      return { success: false, error: "No se pudo verificar el nuevo evento. El original sigue intacto." };
    }

    // Solo ahora eliminar las sesiones y el documento anterior.
    const oldSessions = await eventSessionService.getByEventId(oldEventId);
    for (const session of oldSessions) {
      await eventSessionService.deleteSession(oldEventId, session.id);
    }
    await eventsService.deleteEvent(oldEventId);

    // Invalidar cachés relevantes.
    updateTag(`event-${oldEventId}`);
    updateTag(`event-${newEvent.id}`);
    updateTag("event-list");
    revalidateTag("event-list", "max");

    return { success: true, newEventId: newEvent.id };

  } catch (err) {
    console.error("[migrateEventTypeAction] error:", err);
    return {
      success: false,
      error: "Error durante la migración. Tu evento original sigue intacto.",
    };
  }
}
