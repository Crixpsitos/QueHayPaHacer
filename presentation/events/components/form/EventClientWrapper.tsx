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
import { useAuth } from "@/app/store/auth/AuthContext";
import { EmailVerificationRequiredDialog } from "./EmailVerificationRequiredDialog";
import { EventFormSkeleton } from "./EventFormSkeleton";

interface EventFormClientWrapperProps {
  mode: "create" | "edit";
 initialData?: EventViewModel | null;
}

export const EventClientWrapper = ({
  mode,
 initialData,
}: EventFormClientWrapperProps) => {
  const data = initialData ?  initialData : {};
  const { user, isHydrating } = useAuth();

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

  // Serialize to strip any client references from dnd-kit or other client libs
  const cleanDraft: FormEventDto = JSON.parse(JSON.stringify(eventDraft));
  const { id, ...draftData } = cleanDraft;

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
      // Serialize to strip any client references from dnd-kit or other client libs
      const cleanDraft: FormEventDto = JSON.parse(JSON.stringify(eventDraft));
      const result = await publishEventAction(cleanDraft);

      if (result.success) {
        notify.success("Evento publicado exitosamente.");
        startTransition(() => router.push(`/events/${result.slug}`));
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

  if (mode === "create") {
    if (isHydrating) {
      return <EventFormSkeleton />;
    }

    if (!user?.emailVerified) {
      return <EmailVerificationRequiredDialog />;
    }
  }

  return (
    <EventForm
      mode={mode}
      initialData={data}
      onPublish={handlePublishSubmit}
      onSaveDraft={handleDraftSubmit}
    />
  );
};