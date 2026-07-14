"use client";

import { FormEventDto } from "@/application/dto/events/EventDto";
import { startTransition, useCallback } from "react";
import { EventForm } from "./EventForm";
import { EventTypeSelector } from "./EventTypeSelector";
import { createDraftEventAction } from "@/app/actions/events/create-draft-event.action";
import { updateEventAction } from "@/app/actions/events/update-event.action";
import { notify } from "@/presentation/shared/lib/notify";
import { Events } from "@/domain/entities/events/Events";
import { EventViewModel } from "../../view-models/EventViewModel";
import { publishEventAction } from "@/app/actions/events/publish-event.action";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/store/auth/AuthContext";
import { EmailVerificationRequiredDialog } from "./EmailVerificationRequiredDialog";
import { MultiDateProfessionalRequiredDialog } from "./MultiDateProfessionalRequiredDialog";
import { EventFormSkeleton } from "./EventFormSkeleton";

interface EventFormClientWrapperProps {
  mode: "create" | "edit";
  initialData?: EventViewModel | null;
}

export const EventClientWrapper = ({
  mode,
  initialData,
}: EventFormClientWrapperProps) => {
  const data = initialData ? initialData : {};
  const { user, isHydrating } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventType = searchParams.get("type") as "standard" | "multi-date" | null;

  const isProfessional = user?.customClaims?.role === "professional";

  const handleDraftSubmit = useCallback(
    async (eventDraft: FormEventDto): Promise<Events | null> => {
      const params = new URLSearchParams(window.location.search);

      if (params.has("isNew")) {
        params.delete("isNew");
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }

      const cleanDraft: FormEventDto = JSON.parse(JSON.stringify(eventDraft));
      const { id, ...draftData } = cleanDraft;

      const result: { success?: boolean; error?: string; eventInfo?: Events } =
        id
          ? await updateEventAction(id, draftData)
          : await createDraftEventAction(draftData);

      if (result.success) {
        return result.eventInfo ?? null;
      }

      const message = result.error ?? "Error al guardar el borrador.";
      notify.error(message);
      throw new Error(message);
    },
    [eventType, router],
  );

  const handlePublishSubmit = useCallback(
    async (eventDraft: FormEventDto): Promise<void> => {
      try {
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
    },
    [router],
  );

  if (mode === "create") {
    if (isHydrating) {
      return <EventFormSkeleton />;
    }

    if (!user?.emailVerified) {
      return <EmailVerificationRequiredDialog />;
    }

    // Multi-fecha es exclusivo de cuentas profesionales (defensa en cliente;
    // create-draft/publish también lo validan en el servidor).
    if (eventType === "multi-date" && !isProfessional) {
      return <MultiDateProfessionalRequiredDialog />;
    }

    // If no type selected yet and user is professional → show selector
    if (!eventType && isProfessional) {
      return <EventTypeSelector isProfessional={isProfessional} />;
    }
  }

  return (
    <EventForm
      mode={mode}
      eventType={
        mode === "create"
          ? (eventType === "multi-date" && isProfessional ? "multi-date" : "standard")
          : (initialData as EventViewModel & { eventType?: "standard" | "multi-date" })?.eventType ?? "standard"
      }
      initialData={data}
      onPublish={handlePublishSubmit}
      onSaveDraft={handleDraftSubmit}
    />
  );
};