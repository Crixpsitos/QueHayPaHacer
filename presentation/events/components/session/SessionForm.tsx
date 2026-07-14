"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { createClientContainer } from "@/infraestructure/di/container.client";
import { valibotResolver } from "@hookform/resolvers/valibot";
import type { BaseSchema, BaseIssue } from "valibot";
import type { UseFormReturn } from "react-hook-form";
import dynamic from "next/dynamic";
import type { JSONContent } from "@tiptap/react";

import type { EventSession } from "@/domain/entities/events/EventSession";
import type { EventViewModel } from "../../view-models/EventViewModel";
import {
  FormSessionSchema,
  MAX_SESSION_DURATION_MS,
  type FormSessionDto,
} from "@/application/dto/events/EventSessionDto";
import type { FormEventDto } from "@/application/dto/events/EventDto";
import type { MediaItem } from "@/application/dto/events/EventDto";

import { SessionCoverSelector } from "./SessionCoverSelector";
import { Step4Location } from "../steps/Step4Location";
import { Step5Dates } from "../steps/Step5Dates";
import { Step6Registration } from "../steps/Step6Registration";
import { Step7Pricing } from "../steps/Step7Pricing";
import { ImageMainDropzone } from "../Dropzone/ImageMainDropzone";
import { MediaDropzone } from "../Dropzone/MediaDropzone";
import { RichTextEditorSkeleton } from "../editor/RichTextEditorSkeleton";
import { Button } from "@/app/components/ui/button";
import { notify } from "@/presentation/shared/lib/notify";
import { createEventSessionAction } from "@/app/actions/events/create-event-session.action";
import { updateEventSessionAction } from "@/app/actions/events/update-event-session.action";
import { saveDraftSessionAction } from "@/app/actions/events/save-draft-session.action";
import { uploadToGoogleStorage } from "../../lib/upload/uploadToGoogleStorage";
import { getImageData } from "../../lib/image/getImageData";
import { getVideoData } from "../../lib/video/getVideoData";
import { AlertTriangleIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";

const RichTextEditor = dynamic(
  () => import("../editor/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> },
);

// ─── Pasos ───────────────────────────────────────────────────────────────────

const SESSION_STEPS = [
  { number: 1, label: "Portada" },
  { number: 2, label: "Medios" },
  { number: 3, label: "Información" },
  { number: 4, label: "Ubicación" },
  { number: 5, label: "Fechas" },
  { number: 6, label: "Registro" },
  { number: 7, label: "Precio" },
] as const;

/** Qué paso contiene cada campo, para saltar al primer error al publicar. */
const FIELD_STEP: Record<string, number> = {
  coverSource: 1,
  mainImage: 1,
  media: 2,
  title: 3,
  shortDescription: 3,
  description: 3,
  location: 4,
  startDate: 5,
  endDate: 5,
  registrationType: 6,
  externalUrl: 6,
  capacity: 6,
  requiresAttendance: 6,
  registrationEventForm: 6,
  price: 7,
};

interface SessionFormProps {
  event: Pick<EventViewModel, "id" | "title"> & { mainImage?: { url: string } };
  session?: EventSession | null;
  allSessions: EventSession[];
  hasOverlapWarning?: boolean;
  onSaved: (session: EventSession, hasOverlap: boolean) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function SessionForm({
  event,
  session,
  allSessions,
  hasOverlapWarning = false,
  onSaved,
  onCancel,
  onDirtyChange,
}: SessionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  // Al editar una sesión existente, todos los pasos ya tienen datos: se pueden
  // navegar libremente y se muestran como completados (excepto el actual).
  const isEditingExisting = Boolean(session?.id);

  // El sessionId puede obtenerse antes de llegar al paso final (para uploads)
  const savedSessionIdRef = useRef<string | null>(session?.id ?? null);

  const defaultValues = useMemo<FormSessionDto>(
    () => ({
      id: session?.id,
      eventId: event.id,
      title: session?.title ?? "",
      shortDescription: session?.shortDescription ?? "",
      description: session?.description,
      coverSource: session?.coverSource ?? "parent",
      mainImage: session?.mainImage,
      media: session?.media ?? [],
      location: session?.location
        ? {
            country: session.location.country,
            department: session.location.department,
            city: session.location.city,
            venue: session.location.venue,
            address: session.location.address,
            moreInfo: session.location.moreInfo,
            coordinates: session.location.coordinates,
            siteId: session.location.siteId,
          }
        : undefined,
      startDate:
        session?.startDate instanceof Date
          ? session.startDate.toISOString()
          : (session?.startDate as string | undefined),
      endDate:
        session?.endDate instanceof Date
          ? session.endDate.toISOString()
          : (session?.endDate as string | undefined),
      registrationType: session?.registrationType ?? "none",
      externalUrl: session?.externalUrl,
      capacity: session?.capacity,
      requiresAttendance: session?.requiresAttendance,
      registrationEventForm: session?.registrationEventForm,
      price: session?.price ?? { isFree: true, amount: 0, currency: "COP" },
      status: session?.status ?? "draft",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.id, event.id],
  );

  const form = useForm<FormSessionDto>({
    resolver: valibotResolver(
      FormSessionSchema as unknown as BaseSchema<
        FormSessionDto,
        FormSessionDto,
        BaseIssue<unknown>
      >,
    ),
    defaultValues,
    mode: "onChange",
  });

  const formAsEvent = form as unknown as UseFormReturn<FormEventDto>;

  const coverSource =
    useWatch({ control: form.control, name: "coverSource" }) ?? "parent";
  const mainImage = useWatch({ control: form.control, name: "mainImage" });
  const mediaItems = useWatch({ control: form.control, name: "media" }) ?? [];

  const otherSessions = useMemo(
    () => allSessions.filter((s) => s.id !== session?.id),
    [allSessions, session?.id],
  );

  // Reporta al contenedor si hay cambios sin guardar (para confirmar al cerrar).
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // ponytail: el draft se crea lazy en ensureSessionId (primer upload/guardado),
  // no al montar → abrir el modal ya no deja borradores huérfanos.

  // Escucha la sesión en Firestore: cuando la Cloud Function optimice la imagen
  // (mainImage/media pasan de "processing" a "ready"), refleja el estado en el form.
  const watchedSessionId = useWatch({ control: form.control, name: "id" });
  useEffect(() => {
    if (!watchedSessionId) return;
    const { eventsRepository } = createClientContainer();
    // El gate de auth (esperar sesión del SDK cliente) vive en el repo vía
    // subscribeWhenAuthed → aquí solo suscribimos.
    const unsubscribe = eventsRepository.findSessionByIdOnSnapshot(
      event.id,
      watchedSessionId,
      (remote) => {
        if (!remote) return;
        const remoteMain = remote.mainImage as
          | { url?: string; path?: string; status?: string }
          | undefined;
        if (remoteMain?.status === "ready" && remoteMain.url) {
          form.setValue(
            "mainImage",
            { url: remoteMain.url, path: remoteMain.path, status: "ready" },
            { shouldDirty: false },
          );
        }
        if (Array.isArray(remote.media)) {
          const current = form.getValues("media") ?? [];
          const updated = current.map((local) => {
            if (local.data?.status !== "processing") return local;
            const r = (remote.media as MediaItem[]).find((m) => m.id === local.id);
            return r?.data?.status === "ready" || r?.data?.status === "error"
              ? r
              : local;
          });
          form.setValue("media", updated, { shouldDirty: false });
        }
      },
    );
    return () => unsubscribe();
  }, [watchedSessionId, event.id, form]);

  // ─── Helpers de upload ──────────────────────────────────────────────────

  /** Garantiza que la sesión tiene un ID antes de subir archivos. */
  const ensureSessionId = async (): Promise<string | null> => {
    if (savedSessionIdRef.current) return savedSessionIdRef.current;

    const result = await saveDraftSessionAction(event.id, form.getValues());
    if (result.success) {
      savedSessionIdRef.current = result.session.id;
      form.setValue("id", result.session.id);
      return result.session.id;
    }
    notify.error(result.error ?? "No se pudo guardar el borrador.");
    return null;
  };

  const saveMainImage = async (file: File | null) => {
    if (!file) return;

    const processFile = async () => {
      const sessionId = await ensureSessionId();
      if (!sessionId) throw new Error("no-session-id");

      const imageData = await getImageData(file);
      const isValidResolution = imageData.width >= 1920 && imageData.height >= 1080;
      if (!isValidResolution) {
        form.setError("mainImage" as never, {
          type: "validate",
          message: "La imagen debe tener una resolución mínima de 1920×1080 px.",
        });
        throw new Error("invalid-resolution");
      }

      const result = await uploadToGoogleStorage(file, "sessions", sessionId, {
        fileName: `session-${sessionId}-main-${file.name}`,
        contentType: file.type,
        isPublic: true,
        subFolder: "", // → public/sessions/{sessionId}/{fileName}
        customMetadata: { "event-id": event.id },
        cacheControl: "public, max-age=31536000",
      });

      form.setValue(
        "mainImage",
        {
          url: result.publicUrl,
          path: result.path,
          status: "processing",
          temporaryUrl: result.publicUrl,
        },
        { shouldDirty: true },
      );

      await saveDraftSessionAction(event.id, form.getValues());
      return result;
    };

    await notify.promise(processFile(), {
      loading: "Subiendo portada...",
      success: () => "Portada subida.",
      error: (err) => {
        if ((err as Error).message === "invalid-resolution")
          return "Resolución inválida. Mínimo 1920×1080 px.";
        if ((err as Error).message === "no-session-id")
          return "No se pudo inicializar la sesión.";
        return "Error al subir la imagen.";
      },
    });
  };

  const removeMainImage = () => {
    form.setValue("mainImage", undefined, { shouldValidate: true });
  };

  const saveMediaFiles = async (files: File[]) => {
    const processFiles = async () => {
      const sessionId = await ensureSessionId();
      if (!sessionId) throw new Error("no-session-id");

      const uploadResults = await Promise.all(
        files.map((file) =>
          uploadToGoogleStorage(file, "sessions", sessionId, {
            fileName: `session-${sessionId}-media-${file.name}`,
            contentType: file.type,
            isPublic: true,
            subFolder: "media", // → public/sessions/{sessionId}/media/{fileName}
            customMetadata: { "event-id": event.id },
            cacheControl: "public, max-age=31536000",
          }),
        ),
      );

      const processedMedia: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = uploadResults[i];
        const isVideo = file.type.startsWith("video/");

        if (isVideo) {
          const videoData = await getVideoData(file);
          processedMedia.push({
            id: crypto.randomUUID(),
            type: "video",
            data: {
              status: "processing",
              temporaryUrl: result.publicUrl,
              url: result.publicUrl,
              path: result.path,
              width: videoData.width,
              height: videoData.height,
              duration: videoData.duration,
              mimeType: file.type as "video/mp4" | "video/webm" | "video/ogg",
            },
          });
        } else if (file.type.startsWith("image/")) {
          const imageData = await getImageData(file);
          processedMedia.push({
            id: crypto.randomUUID(),
            type: "image",
            data: {
              status: "processing",
              temporaryUrl: result.publicUrl,
              url: result.publicUrl,
              path: result.path,
              width: imageData.width,
              height: imageData.height,
              alt: file.name,
            },
          });
        }
      }

      const existing = form.getValues("media") ?? [];
      form.setValue("media", [...existing, ...processedMedia], {
        shouldValidate: true,
      });

      await saveDraftSessionAction(event.id, form.getValues());
      return processedMedia;
    };

    notify.promise(processFiles(), {
      loading: "Subiendo archivos...",
      success: () => "Archivos subidos.",
      error: (err) => {
        if ((err as Error).message === "no-session-id")
          return "No se pudo inicializar la sesión.";
        return "Error al subir los archivos.";
      },
    });
  };

  const removeMediaFile = (id: string) => {
    const current = form.getValues("media") ?? [];
    form.setValue(
      "media",
      current.filter((f) => f.id !== id),
      { shouldValidate: true },
    );
  };

  // ─── Guardar / publicar ──────────────────────────────────────────────────

  const submitSession = (targetStatus: EventSession["status"]) => {
    startTransition(async () => {
      const values = form.getValues();
      const sessionId = savedSessionIdRef.current ?? values.id;

      // Borrador: acción lenient (crea o hace merge sin validación estricta).
      if (targetStatus === "draft") {
        const result = await saveDraftSessionAction(event.id, {
          ...values,
          status: "draft",
        });
        if (result.success) {
          savedSessionIdRef.current = result.session.id;
          form.setValue("id", result.session.id);
          notify.success("Borrador guardado.");
          onSaved(result.session, false);
        } else {
          notify.error(result.error ?? "Error al guardar el borrador.");
        }
        return;
      }

      // Publicar exige validación completa del formulario.
      const isValid = await form.trigger();
      if (!isValid) {
        // Salta al primer paso con error para que el usuario vea el campo.
        const firstStep = Object.keys(form.formState.errors).reduce(
          (min, key) => Math.min(min, FIELD_STEP[key] ?? Infinity),
          Infinity,
        );
        if (Number.isFinite(firstStep)) setCurrentStep(firstStep);
        notify.error("Completa los campos requeridos antes de publicar la sesión.");
        return;
      }

      const payload = {
        title: values.title || undefined,
        shortDescription: values.shortDescription,
        description: values.description,
        coverSource: values.coverSource ?? "parent",
        mainImage: values.mainImage,
        media: values.media ?? [],
        location: values.location as EventSession["location"],
        startDate: values.startDate ? new Date(values.startDate) : new Date(),
        endDate: values.endDate
          ? new Date(values.endDate)
          : new Date(Date.now() + 3_600_000),
        registrationType: values.registrationType ?? "none",
        externalUrl: values.externalUrl,
        capacity: values.capacity,
        requiresAttendance: values.requiresAttendance,
        registrationEventForm: {
          fields: values.registrationEventForm?.fields ?? [],
        },
        price: (values.price ?? {
          isFree: true,
          amount: 0,
          currency: "COP",
        }) as EventSession["price"],
        status: targetStatus,
      };

      const result = sessionId
        ? await updateEventSessionAction(event.id, sessionId, payload)
        : await createEventSessionAction(event.id, payload);

      if (result.success) {
        savedSessionIdRef.current = result.session.id;
        notify.success(
          result.hasOverlap
            ? "Sesión publicada. ⚠️ Solapamiento con otra sesión."
            : "Sesión publicada.",
        );
        onSaved(result.session, result.hasOverlap);
      } else {
        notify.error(result.error ?? "Error al publicar la sesión.");
      }
    });
  };

  const handleNext = () => {
    if (currentStep < SESSION_STEPS.length) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // ─── Render por paso ──────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      /* ── Paso 1: Portada ─────────────────────────────────────────────── */
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-900">Portada de la sesión</h3>
              <p className="text-sm text-gray-500">¿Qué imagen usará esta sesión como portada?</p>
            </div>

            <SessionCoverSelector
              value={coverSource as EventSession["coverSource"]}
              onChange={(v) =>
                form.setValue(
                  "coverSource",
                  v as FormSessionDto["coverSource"],
                )
              }
              parentCoverUrl={event.mainImage?.url}
              otherSessions={otherSessions}
              ownImageUrl={mainImage?.url}
              onUploadOwn={() => {/* el dropzone de abajo maneja el upload */}}
            />

            {/* Solo mostrar el uploader de portada propia cuando aplica */}
            {coverSource === "own" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Subir portada propia</p>
                <ImageMainDropzone
                  value={
                    mainImage?.url
                      ? {
                          status: mainImage.status ?? "ready",
                          temporaryUrl: mainImage.temporaryUrl,
                          desktop: { url: mainImage.url },
                        }
                      : null
                  }
                  onChange={saveMainImage}
                  removeMainImage={removeMainImage}
                />
              </div>
            )}
          </div>
        );

      /* ── Paso 2: Medios ───────────────────────────────────────────────── */
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-gray-900">Medios de la sesión</h3>
              <p className="text-sm text-gray-500">
                Agrega fotos y videos que muestren esta sesión.
              </p>
            </div>
            <MediaDropzone
              value={(mediaItems as MediaItem[]) ?? []}
              onChange={saveMediaFiles}
              removeMediaFile={removeMediaFile}
            />
          </div>
        );

      /* ── Paso 3: Información ─────────────────────────────────────────── */
      case 3: {
        const titleVal = form.watch("title") ?? "";
        const shortDescVal = form.watch("shortDescription") ?? "";
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-medium text-gray-900">Información de la sesión</h3>
              <p className="text-sm text-gray-500">Cuéntanos sobre esta fecha específica.</p>
            </div>

            {/* Título */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel className="text-sm font-medium text-zinc-700">
                  Título <span className="font-normal text-gray-400">(opcional)</span>
                </FieldLabel>
                <span className="font-mono text-xs text-gray-400">{titleVal.length}/80</span>
              </div>
              <Input
                {...form.register("title")}
                maxLength={80}
                placeholder="Ej: Noche del 7 de diciembre"
              />
            </Field>

            {/* Sinopsis */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel className="text-sm font-medium text-zinc-700">
                  Sinopsis <span className="font-normal text-gray-400">(opcional)</span>
                </FieldLabel>
                <span className="font-mono text-xs text-gray-400">{shortDescVal.length}/150</span>
              </div>
              <Input
                {...form.register("shortDescription")}
                maxLength={150}
                placeholder="Resumen breve de lo que pasará en esta sesión..."
              />
              {form.formState.errors.shortDescription && (
                <FieldError errors={[form.formState.errors.shortDescription]} />
              )}
            </Field>

            {/* Descripción detallada */}
            <Field>
              <FieldLabel className="text-sm font-medium text-zinc-700">
                Descripción detallada <span className="font-normal text-gray-400">(opcional)</span>
              </FieldLabel>
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all focus-within:border-zinc-900">
                <RichTextEditor
                  value={form.watch("description") as JSONContent}
                  onChange={(val) => form.setValue("description", val)}
                  onBlur={() => {}}
                />
              </div>
            </Field>
          </div>
        );
      }

      /* ── Pasos 4-7: reutilizados ─────────────────────────────────────── */
      case 4:
        return <Step4Location form={formAsEvent} />;
      case 5:
        return (
          <div className="space-y-4">
            <Step5Dates
              form={formAsEvent}
              maxDurationMs={MAX_SESSION_DURATION_MS}
            />
            {hasOverlapWarning && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Las fechas se solapan con otra sesión. Puedes guardar el
                  borrador pero deberás resolverlo antes de publicar.
                </span>
              </div>
            )}
          </div>
        );
      case 6:
        return <Step6Registration form={formAsEvent} />;
      case 7:
        return <Step7Pricing form={formAsEvent} />;

      default:
        return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <LazyMotion features={domAnimation}>
    <div className="flex h-full min-h-0 flex-col">
      {/* Mini stepper */}
      <div className="flex gap-1.5 overflow-x-auto px-6 pt-5 pb-2">
        {SESSION_STEPS.map((step) => {
          const isCurrent = step.number === currentStep;
          const canGo = isEditingExisting || step.number <= currentStep;
          const isDone = isEditingExisting
            ? !isCurrent
            : step.number < currentStep;
          return (
            <button
              key={step.number}
              type="button"
              onClick={() => canGo && setCurrentStep(step.number)}
              disabled={!canGo}
              className={`flex min-w-16 flex-1 flex-col items-center gap-1 rounded-lg py-2 text-center text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-gray-100 text-black"
                  : isDone
                    ? "cursor-pointer text-gray-500 hover:bg-gray-50"
                    : "cursor-not-allowed text-gray-300"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  isDone
                    ? "border-black bg-black text-white"
                    : isCurrent
                      ? "border-black bg-white text-black"
                      : "border-gray-200 text-gray-300"
                }`}
              >
                {isDone ? <CheckIcon className="h-3 w-3" /> : step.number}
              </span>
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Contenido del paso actual (llena el espacio, scroll propio) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <m.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {renderStep()}
          </m.div>
        </AnimatePresence>
      </div>

      {/* Navegación (fija abajo) */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={isPending}
          className="gap-1"
        >
          {currentStep === 1 ? (
            "Cancelar"
          ) : (
            <>
              <ChevronLeftIcon className="h-4 w-4" />
              Anterior
            </>
          )}
        </Button>

        {currentStep === SESSION_STEPS.length ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => submitSession("draft")}
              disabled={isPending}
            >
              {isPending ? "Guardando…" : "Guardar borrador"}
            </Button>
            <Button
              type="button"
              onClick={() => submitSession("published")}
              disabled={isPending}
              className="gap-1 bg-black text-white hover:bg-gray-800"
            >
              <CheckIcon className="h-4 w-4" />
              Publicar sesión
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isPending}
            className="gap-1 bg-black text-white hover:bg-gray-800"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
    </LazyMotion>
  );
}
