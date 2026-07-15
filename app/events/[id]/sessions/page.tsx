import { notFound } from "next/navigation";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { SessionManagerClientWrapper } from "@/presentation/events/components/session/SessionManagerClientWrapper";

interface SessionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventSessionsPage({ params }: SessionsPageProps) {
  const { id } = await params;

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    notFound();
  }

  const { eventsService, eventSessionService } = createServerContainer();

  const event = await eventsService.getEventById(id);

  if (!event || event.author.id !== tokens.decodedToken.uid) {
    notFound();
  }

  // Permitir acceso aunque eventType no esté guardado (compatibilidad con eventos anteriores)
  // Si no es multi-date, redirigir al formulario de edición
  if (event.eventType && event.eventType !== "multi-date") {
    notFound();
  }

  const [sessions] = await Promise.all([eventSessionService.getByEventId(id)]);

  const eventViewModel = EventViewModelMapper.toViewModel(event);

  return (
    <SessionManagerClientWrapper
      event={eventViewModel}
      initialSessions={sessions}
    />
  );
}
