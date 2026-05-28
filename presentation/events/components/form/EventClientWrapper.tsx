"use client";

import { FormEventDto } from "@/application/dto/events/EventDto";
import { useCallback } from "react";
import { EventForm } from "./EventForm";
import { createDraftEventAction } from "@/app/actions/events/create-draft-event.action";
import { updateEventAction } from "@/app/actions/events/update-event.action";
import { notify } from "@/presentation/shared/lib/notify";
import { Events } from "@/domain/entities/events/Events";
import { EventViewModel } from "../../view-models/EventViewModel";

interface EventFormClientWrapperProps {
  mode: "create" | "edit";
 initialData?: EventViewModel | null;
}

export const EventClientWrapper = ({
  mode,
 initialData,
}: EventFormClientWrapperProps) => {
  const data = initialData ?  initialData : {};

  const handleDraftSubmit = useCallback(async (eventDraft: FormEventDto): Promise<Events | null> => {
    const { id, ...draftData } = eventDraft;

    const result: { success?: boolean; error?: string; eventInfo?: Events } = id 
      ? await updateEventAction(id, draftData)
      : await createDraftEventAction(draftData);

    if (result.success) {
      return result.eventInfo ?? null;
    }

    const message = result.error ?? "Error al guardar el borrador.";
    notify.error(message);
    throw new Error(message);
  }, []);

  return (
    <EventForm
      mode={mode}
      initialData={data}
      onPublish={handleDraftSubmit}
      onSaveDraft={handleDraftSubmit}
    />
  );
};