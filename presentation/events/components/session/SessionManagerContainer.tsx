import { notFound } from "next/navigation";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { SessionManagerClientWrapper } from "./SessionManagerClientWrapper";

interface SessionManagerContainerProps {
  eventId: string;
}

/**
 * Gestor de sesiones del dueño. Vive fuera de `page.tsx` para poder leerse
 * dentro del <Suspense> de `ServerBoundary`: lee cookies (datos sin cachear) y
 * con Cache Components eso fuera de un boundary rompe el prerender.
 */
export async function SessionManagerContainer({
  eventId,
}: SessionManagerContainerProps) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    notFound();
  }

  const { eventsService, eventSessionService } = createServerContainer();

  const event = await eventsService.getEventById(eventId);

  if (!event || event.author.id !== tokens.decodedToken.uid) {
    notFound();
  }

  // Permitir acceso aunque eventType no esté guardado (compatibilidad con eventos anteriores)
  // Si no es multi-date, redirigir al formulario de edición
  if (event.eventType && event.eventType !== "multi-date") {
    notFound();
  }

  const sessions = await eventSessionService.getByEventId(eventId);
  const eventViewModel = EventViewModelMapper.toViewModel(event);

  return (
    <SessionManagerClientWrapper
      event={eventViewModel}
      initialSessions={sessions}
    />
  );
}
