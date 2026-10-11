import { notFound } from "next/navigation";
import { EventViewModel } from "../../view-models/EventViewModel";
import { EventViewModelMapper } from "../../mapper/EventViewModelMapper";
import { createServerContainer } from "@/infraestructure/di/container";
import { requireEventPermission } from "@/app/actions/_session";
import { EventClientWrapper } from "./EventClientWrapper";

interface EventFormServerWrapperProps {
  eventId: string;
}

// Sin caché: el permiso (dueño o editor) debe reflejar el equipo actual, no una copia de horas.
const getEditableEventData = async (
  id: string,
): Promise<EventViewModel | null> => {
  const access = await requireEventPermission(id, "edit_event", { ownerNeedsPremium: false });
  if (!access) return null;

  const { eventsService } = createServerContainer();
  const eventData = await eventsService.getEventById(id);
  if (!eventData) return null;

  return EventViewModelMapper.toViewModel(eventData);
};

export const EventServerWrapper = async ({
  eventId,
}: EventFormServerWrapperProps) => {
  const eventData = await getEditableEventData(eventId);

  // El evento no existe (o no tienes permiso de edición) → 404.
  if (!eventData) {
    notFound();
  }

  // El wizard renderiza el tipo correcto según eventData.eventType:
  // standard → 7 pasos; multi-date → 5 pasos con gestor de sesiones.
  return <EventClientWrapper mode="edit" initialData={eventData} />;
};
