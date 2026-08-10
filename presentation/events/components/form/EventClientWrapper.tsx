"use client";

import { FormEventDto } from "@/application/dto/events/EventDto";
import { startTransition, useCallback, useState, useEffect, useRef } from "react";
import { EventForm } from "./EventForm";
import { EventTypeSelector } from "./EventTypeSelector";
import { createDraftEventAction } from "@/app/actions/events/create-draft-event.action";
import { updateEventAction } from "@/app/actions/events/update-event.action";
import { migrateEventTypeAction } from "@/app/actions/events/migrate-event-type.action";
import { notify } from "@/presentation/shared/lib/notify";
import { Events } from "@/domain/entities/events/Events";
import { EventViewModel } from "../../view-models/EventViewModel";
import { publishEventAction } from "@/app/actions/events/publish-event.action";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/store/auth/AuthContext";
import { EmailVerificationRequiredDialog } from "./EmailVerificationRequiredDialog";
import { MultiDateProfessionalRequiredDialog } from "./MultiDateProfessionalRequiredDialog";
import { EventFormSkeleton } from "./EventFormSkeleton";
import { ConvertToStandardDialog } from "./ConvertToStandardDialog";
import { ConvertToMultiDateDialog } from "./ConvertToMultiDateDialog";
import { Loader2 } from "lucide-react";

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
  const urlType = searchParams.get("type") as "standard" | "multi-date" | null;

  const isProfessional = user?.customClaims?.role === "professional";

  const existingId = (initialData as EventViewModel)?.id;
  const persistedEventType = (initialData as EventViewModel)?.eventType ?? "standard";

  const resolvedEditorType: "standard" | "multi-date" = mode === "edit"
    ? persistedEventType
    : (urlType === "multi-date" && isProfessional ? "multi-date" : "standard");

  // ── Estado de migración (solo EDIT) ───────────────────────────────────────
  const [isMigrating, setIsMigrating] = useState(false);
  const migrationStartedRef = useRef(false);
  const migrationTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isMigrating || migrationTargetRef.current === null) return;
    if (persistedEventType === migrationTargetRef.current) {
      migrationTargetRef.current = null;
      migrationStartedRef.current = false;
      setIsMigrating(false);
    }
  }, [isMigrating, persistedEventType]);

  // ── Normalización de URL al montar (solo EDIT) ────────────────────────────
  const urlNormalizedRef = useRef(false);
  useEffect(() => {
    if (mode !== "edit" || !existingId || urlNormalizedRef.current) return;
    urlNormalizedRef.current = true;
    const currentUrlType = new URLSearchParams(window.location.search).get("type");
    if (currentUrlType !== persistedEventType) {
      const params = new URLSearchParams(window.location.search);
      params.set("type", persistedEventType);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Diálogos de conversión ────────────────────────────────────────────────
  const [showConvertToMultiDialog, setShowConvertToMultiDialog] = useState(false);
  const [showConvertToStandardDialog, setShowConvertToStandardDialog] = useState(false);
  // Almacena el formId del draft cuando el toggle se activa en CREATE con ID existente.
  const createDraftIdRef = useRef<string | undefined>(undefined);
  // Snapshot del formulario capturado en el momento del toggle, para pasarlo a migrateEventTypeAction.
  const formSnapshotRef = useRef<FormEventDto | undefined>(undefined);

  // ── Migración real (solo EDIT o CREATE con ID guardado) ───────────────────
  const runMigration = useCallback(async (
    targetType: "standard" | "multi-date",
    selectedSessionId?: string | null,
  ) => {
    const effectiveId = createDraftIdRef.current ?? existingId;
    if (isMigrating || migrationStartedRef.current || !effectiveId) return;

    migrationStartedRef.current = true;
    migrationTargetRef.current = targetType;
    setIsMigrating(true);

    try {
      const result = await migrateEventTypeAction({
        oldEventId: effectiveId,
        targetType,
        // Usar snapshot capturado en el toggle; evita pasar initialData (undefined en CREATE).
        currentFormData: formSnapshotRef.current ?? (initialData as Partial<FormEventDto>),
        selectedSessionId: selectedSessionId ?? undefined,
      });

      if (!result.success) {
        migrationStartedRef.current = false;
        migrationTargetRef.current = null;
        setIsMigrating(false);
        notify.error(result.error ?? "No se pudo completar la migración. Tu evento original sigue intacto.");
        return;
      }

      router.replace(`/eventos/${result.newEventId}/edit?type=${targetType}`);
    } catch {
      migrationStartedRef.current = false;
      migrationTargetRef.current = null;
      setIsMigrating(false);
      notify.error("Error inesperado durante la migración. Tu evento original sigue intacto.");
    }
  }, [isMigrating, existingId, initialData, router]);

  // ── Toggle ────────────────────────────────────────────────────────────────
  const handleToggleEventType = useCallback((formId?: string, formSnapshot?: FormEventDto) => {
    if (isMigrating || migrationStartedRef.current) return;

    // Guardar snapshot ANTES de cualquier cambio de estado o tipo.
    formSnapshotRef.current = formSnapshot;

    if (mode === "create") {
      if (!formId) {
        // Sin ID persistido: transformación local pura, sin ninguna Server Action.
        // Solo actualizar el query param; EventForm conserva su estado.
        const targetType = resolvedEditorType === "standard" ? "multi-date" : "standard";
        const params = new URLSearchParams(window.location.search);
        params.set("type", targetType);
        router.replace(`${window.location.pathname}?${params.toString()}`);
        return;
      }
      // Con ID de draft: mostrar diálogo de confirmación antes de migrar.
      createDraftIdRef.current = formId;
      if (resolvedEditorType === "standard") {
        setShowConvertToMultiDialog(true);
      } else {
        setShowConvertToStandardDialog(true);
      }
      return;
    }

    // EDIT: diálogo + migración en Firestore.
    createDraftIdRef.current = undefined;
    if (persistedEventType === "standard") {
      setShowConvertToMultiDialog(true);
    } else {
      setShowConvertToStandardDialog(true);
    }
  }, [mode, isMigrating, resolvedEditorType, persistedEventType, router]);

  const handleConvertToMultiConfirm = useCallback(() => {
    setShowConvertToMultiDialog(false);
    void runMigration("multi-date");
  }, [runMigration]);

  const handleConvertToMultiCancel = useCallback(() => {
    setShowConvertToMultiDialog(false);
  }, []);

  const handleConvertToStandardConfirm = useCallback((sessionId: string | null) => {
    setShowConvertToStandardDialog(false);
    void runMigration("standard", sessionId);
  }, [runMigration]);

  const handleConvertToStandardCancel = useCallback(() => {
    setShowConvertToStandardDialog(false);
  }, []);

  // ── handleDraftSubmit ─────────────────────────────────────────────────────
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
    [],
  );

  const handlePublishSubmit = useCallback(
    async (eventDraft: FormEventDto): Promise<void> => {
      try {
        const cleanDraft: FormEventDto = JSON.parse(JSON.stringify(eventDraft));
        const result = await publishEventAction(cleanDraft);

        if (result.success) {
          notify.success("Evento publicado exitosamente.");
          startTransition(() => router.push(`/eventos/${result.slug}`));
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

  const stepParam = searchParams.get("step");
  const initialStep =
    stepParam === "sessions" && resolvedEditorType === "multi-date" ? 4 : undefined;

  // ── Returns ───────────────────────────────────────────────────────────────
  if (mode === "create") {
    if (isHydrating) {
      return <EventFormSkeleton />;
    }
    if (!user?.emailVerified) {
      return <EmailVerificationRequiredDialog />;
    }
    if (urlType === "multi-date" && !isProfessional) {
      return <MultiDateProfessionalRequiredDialog />;
    }
    if (!urlType && isProfessional) {
      return <EventTypeSelector isProfessional={isProfessional} />;
    }
  }

  return (
    <>
      {/* Overlay sobre el formulario — no lo desmonta, preserva su estado si falla la migración. */}
      {isMigrating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#FAFAFC]/90 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-[#E63946]" />
          <p className="text-sm font-medium text-[#71717A]">
            Preparando tu evento…
          </p>
        </div>
      )}
      {showConvertToMultiDialog && (
        <ConvertToMultiDateDialog
          onConfirm={handleConvertToMultiConfirm}
          onCancel={handleConvertToMultiCancel}
        />
      )}
      {showConvertToStandardDialog && (existingId ?? createDraftIdRef.current) && (
        <ConvertToStandardDialog
          eventId={(existingId ?? createDraftIdRef.current)!}
          onConfirm={handleConvertToStandardConfirm}
          onCancel={handleConvertToStandardCancel}
        />
      )}
      <EventForm
        mode={mode}
        eventType={resolvedEditorType}
        initialData={data}
        initialStep={initialStep}
        onPublish={handlePublishSubmit}
        onSaveDraft={handleDraftSubmit}
        onToggleEventType={handleToggleEventType}
        isMigratingEventType={isMigrating}
      />
    </>
  );
};
