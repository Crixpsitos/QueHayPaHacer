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
import { getTiptapPlainText } from "@/application/dto/events/EventDto";

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
  // Al editar una sesión existente, se puede navegar libremente a cualquier paso.
  // La completitud depende del contenido real, no de si existe el ID.
  const isEditingExisting = Boolean(session?.id);

  /**
   * Para sesiones existentes: el paso está "hecho" si sus campos obligatorios tienen valor.
   * Para sesiones nuevas: el paso está "hecho" si ya se pasó por él (step.number < currentStep).
   */
  function isStepDone(stepNumber: number, title: string, description: FormSessionDto["description"], location: FormSessionDto["location"], startDate: string | undefined): boolean {
    if (!isEditingExisting) return stepNumber < currentStep;
    if (stepNumber === currentStep) return false;
    switch (stepNumber) {
      case 1: return true;
      case 2: return true;
      case 3: return !!(title.trim()) && getTiptapPlainText(description).trim().length >= 10;
      case 4: return !!(location?.venue?.trim() && location?.city?.name?.trim());
      case 5: return !!startDate;
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  }

  // El sessionId puede obtenerse antes de llegar al paso final (para uploads)
  const savedSessionIdRef = useRef<string | null>(session?.id ?? null);

  const defaultValues = useMemo<FormSessionDto>(
    () => ({
      id: session?.id,
      eventId: event.id,
      title: session?.title ?? "",
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

  // Campos para calcular completitud de pasos (leídos aquí, después de useForm)
  const stepTitle = form.watch("title") ?? "";
  const stepDescription = form.watch("description");
  const stepLocation = form.watch("location");
  const stepStartDate = form.watch("startDate");

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
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-[#09090B]">Portada de la sesión</p>
              <p className="mt-0.5 text-xs text-[#71717A]">¿Qué imagen usará esta sesión como portada?</p>
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

            {/* Uploader de portada propia */}
            {coverSource === "own" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wide">Subir portada propia</p>
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
              <p className="text-sm font-semibold text-[#09090B]">Medios de la sesión</p>
              <p className="mt-0.5 text-xs text-[#71717A]">
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
        const descContent = form.watch("description");
        const descCharCount = getTiptapPlainText(descContent ?? { type: "doc", content: [] }).length;
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
                  Título
                </FieldLabel>
                <span className="font-mono text-xs text-gray-400">{titleVal.length}/60</span>
              </div>
              <Input
                {...form.register("title")}
                maxLength={60}
                placeholder="Ej: Noche del 7 de diciembre"
              />
              {form.formState.errors.title && (
                <FieldError errors={[form.formState.errors.title]} />
              )}
            </Field>

            {/* Descripción detallada */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel className="text-sm font-medium text-zinc-700">
                  Descripción detallada
                </FieldLabel>
                <span className="font-mono text-xs text-gray-400">{descCharCount}/1000</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all focus-within:border-zinc-900">
                <RichTextEditor
                  value={form.watch("description") as JSONContent}
                  onChange={(val) => form.setValue("description", val, { shouldValidate: true })}
                  onBlur={() => {}}
                />
              </div>
              {form.formState.errors.description && (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <FieldError errors={[form.formState.errors.description as any]} />
              )}
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
      {/* Stepper de pasos */}
      <div className="border-b border-[#F4F4F5] bg-white px-4 pt-3 pb-0">
        <div className="flex items-start overflow-x-auto">
          {SESSION_STEPS.map((step, idx) => {
            const isCurrent = step.number === currentStep;
            const canGo = isEditingExisting || step.number <= currentStep;
            const isDone = isStepDone(step.number, stepTitle, stepDescription, stepLocation, stepStartDate);
            const isLast = idx === SESSION_STEPS.length - 1;
            return (
              <div key={step.number} className="flex flex-1 flex-col items-center">
                {/* Fila: línea izquierda + círculo + línea derecha */}
                <div className="flex w-full items-center">
                  {/* Línea izquierda */}
                  {idx > 0 ? (
                    <div className={`h-0.5 flex-1 transition-colors ${isDone || isCurrent ? "bg-[#09090B]" : "bg-[#E4E4E7]"}`} />
                  ) : (
                    <div className="flex-1" />
                  )}
                  {/* Círculo */}
                  <button
                    type="button"
                    onClick={() => canGo && setCurrentStep(step.number)}
                    disabled={!canGo}
                    className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      isCurrent
                        ? "bg-[#E63946] text-white shadow-primary-glow scale-110"
                        : isDone
                          ? "cursor-pointer bg-[#09090B] text-white hover:scale-105"
                          : canGo
                            ? "cursor-pointer border-2 border-[#E4E4E7] bg-white text-[#A1A1AA] hover:border-[#09090B] hover:text-[#09090B]"
                            : "cursor-not-allowed border-2 border-[#F4F4F5] bg-white text-[#D4D4D8]"
                    }`}
                  >
                    {isDone ? <CheckIcon className="size-4" /> : step.number}
                  </button>
                  {/* Línea derecha */}
                  {!isLast ? (
                    <div className={`h-0.5 flex-1 transition-colors ${isDone ? "bg-[#09090B]" : "bg-[#E4E4E7]"}`} />
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
                {/* Label */}
                <button
                  type="button"
                  onClick={() => canGo && setCurrentStep(step.number)}
                  disabled={!canGo}
                  className={`mt-1.5 mb-2.5 hidden text-center text-[11px] leading-tight transition-colors sm:block ${
                    isCurrent
                      ? "font-semibold text-[#E63946]"
                      : isDone
                        ? "font-medium text-[#71717A] hover:text-[#09090B]"
                        : "font-medium text-[#D4D4D8]"
                  }`}
                >
                  {step.label}
                </button>
                {/* Versión mobile: solo número de paso activo */}
                <span className={`mb-2 text-[10px] font-medium sm:hidden ${isCurrent ? "text-[#E63946]" : "text-transparent"}`}>
                  {isCurrent ? `${step.number}/${SESSION_STEPS.length}` : "."}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido del paso — scroll propio, ancho contenido */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-5">
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
      </div>

      {/* Navegación (fija abajo) */}
      <div className="flex items-center justify-between gap-3 border-t border-[#F4F4F5] bg-white px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={isPending}
          className="gap-1 border-[#E4E4E7] text-[#09090B] hover:bg-[#FAFAFC]"
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
              className="border-[#E4E4E7] text-[#09090B] hover:bg-[#FAFAFC]"
            >
              {isPending ? "Guardando…" : "Guardar borrador"}
            </Button>
            <Button
              type="button"
              onClick={() => submitSession("published")}
              disabled={isPending}
              className="gap-1 bg-[#E63946] text-white hover:bg-[#9B0A26] shadow-primary-glow"
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
            className="gap-1 bg-[#09090B] text-white hover:bg-[#27272A]"
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
