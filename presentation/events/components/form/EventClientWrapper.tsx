"use client";

import { FormEventDto } from "@/application/dto/events/EventDto";
import { startTransition, useCallback } from "react";
import { EventForm } from "./EventForm";
import { createDraftEventAction } from "@/app/actions/events/create-draft-event.action";
import { updateEventAction } from "@/app/actions/events/update-event.action";
import { notify } from "@/presentation/shared/lib/notify";
import { Events } from "@/domain/entities/events/Events";
import { EventViewModel } from "../../view-models/EventViewModel";
import { publishEventAction } from "@/app/actions/events/publish-event.action";
import { useRouter } from "next/navigation";

interface EventFormClientWrapperProps {
  mode: "create" | "edit";
 initialData?: EventViewModel | null;
}

export const EventClientWrapper = ({
  mode,
 initialData,
}: EventFormClientWrapperProps) => {
  const data = initialData ?  initialData : {};
  

  const router = useRouter();
const handleDraftSubmit = useCallback(async (eventDraft: FormEventDto): Promise<Events | null> => {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has("isNew")) {
    params.delete("isNew");
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}` 
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }

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

  const handlePublishSubmit = useCallback(async (eventDraft: FormEventDto): Promise<void> => {
    try {
      const result = await publishEventAction(eventDraft);

      if (result.success) {
        notify.success("Evento publicado exitosamente.");
        startTransition(() => router.push(`/`));
      } else {
        notify.error(result.error ?? "Error al publicar evento.");
        return;
      }
    } catch (error) {
      console.error("Error al publicar evento:", error);
      notify.error("Error al publicar evento");
      throw new Error("Error al publicar evento");
    }
  }, [router]);

  return (
    <EventForm
      mode={mode}
      initialData={data}
      onPublish={handlePublishSubmit}
      onSaveDraft={handleDraftSubmit}
    />
  );
};