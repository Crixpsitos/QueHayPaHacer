"use client";

import { useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { FormEventDto, MediaItem } from "@/application/dto/events/EventDto";
import { FieldGroup } from "@/app/components/ui/field";
import { MediaDropzone } from "../Dropzone/MediaDropzone";
import { ImageMainDropzone } from "../Dropzone/ImageMainDropzone";
import { notify } from "@/presentation/shared/lib/notify";
import { getVideoData } from "../../lib/video/getVideoData";
import { getImageData } from "../../lib/image/getImageData";
import { prepareUpload, putToStorage, type UploadOptions } from "../../lib/upload/uploadToGoogleStorage";
import { uploadMediaPersistFirst } from "../../lib/upload/uploadMediaPersistFirst";
import { retryEventMediaAction } from "@/app/actions/events/retry-event-media.action";
import { useEventModalStore } from "@/presentation/events/store/useEventModalStore";
interface Step2Props {
  form: UseFormReturn<FormEventDto>;
  saveDraftEvent: () => Promise<void>;
  /** Si es true, oculta la sección de medios adicionales (ideal para encabezado multi-fecha). */
  hideMedia?: boolean;
}

export const Step2Media = ({ form, saveDraftEvent, hideMedia = false }: Step2Props) => {
  const eventId = form.watch("id") as string;
  const mainImage = form.watch("mainImage");
  const mainImageStatus = mainImage?.status;
  const mainImageTemporaryUrl = mainImage?.temporaryUrl;
  const setIsOpen = useEventModalStore((state) => state.setIsOpen);

  const hasMainImagePreview =
    Boolean(mainImage?.url) ||
    Boolean(mainImageTemporaryUrl) ||
    Boolean((mainImage as any)?.temporaryUrl) ||
    Boolean((mainImage as any)?.desktop?.url);

  useEffect(() => {
    if (hasMainImagePreview) {
      form.clearErrors("mainImage");
    }
  }, [hasMainImagePreview, form]);

  const removeMainImage = () => {
    // clear mainImage object
    form.setValue("mainImage", undefined, { shouldValidate: true });
  };

  const removeMediaFile = (id: string) => {
    const current = form.getValues("media") ?? [];
    form.setValue(
      "media",
      current.filter((f) => f.id !== id),
      { shouldValidate: true },
    );
  };

  const saveMainImage = async (file: File | null) => {
    if (!file) return;
    setIsOpen(false);

  const processFile = async () => {
    const imageData = await getImageData(file);
    const isValidMainResolution =
      imageData.width >= 1280 && imageData.height >= 720;

    if (!isValidMainResolution) {
      form.setError("mainImage", {
        type: "validate",
        message: "La imagen principal debe tener una resolución mínima de 1280x720 píxeles.",
      });
      throw new Error("invalid-main-image-resolution");
    }

    if (!eventId) {
      await saveDraftEvent();
    }
    
    const currentEventId = form.getValues("id") as string;

    const uploadOptions: UploadOptions = {
      fileName: `deoptimized-main-image-${file.name}`,
      contentType: file.type,
      isPublic: true,
    };
    const prepared = await prepareUpload(file, "events", currentEventId, uploadOptions);

    form.clearErrors("mainImage");

    // Se guarda "processing" ANTES de subir: el CF lee/escribe mainImage al terminar la subida y un guardado posterior
    // con la copia local (processing) deshacía su resultado.
    const mainImageBase = { url: prepared.publicUrl, path: prepared.path, temporaryUrl: prepared.publicUrl };
    const previousMainImage = form.getValues("mainImage");
    form.setValue("mainImage", { ...mainImageBase, status: "processing" }, { shouldValidate: false, shouldDirty: true });
    try {
      await saveDraftEvent();
    } catch (error) {
      // Nada se subió: volver a la portada anterior en vez de dejar una "processing" que apunta a un archivo inexistente.
      form.setValue("mainImage", previousMainImage, { shouldValidate: false, shouldDirty: true });
      throw error;
    }

    try {
      await putToStorage(file, prepared, uploadOptions);
    } catch (error) {
      form.setValue("mainImage", { ...mainImageBase, status: "error" }, { shouldValidate: false, shouldDirty: true });
      await saveDraftEvent();
      throw error;
    }

    const result = { publicUrl: prepared.publicUrl, path: prepared.path };
    return result;
  };

  await notify.promise(processFile(), {
    loading: "Subiendo y guardando imagen, por favor espera...",
    success: () => "Imagen subida.",
    error: (error) => {
      if (error instanceof Error && error.message === "invalid-main-image-resolution") {
        return "Resolución inválida. La imagen principal debe tener al menos 1280x720.";
      }
      console.error("Error:", error);
      return "Error al subir la imagen principal.";
    },
  });
  };
  const retryMedia = async (mediaId: string) => {
    const result = await retryEventMediaAction(eventId, mediaId);
    const current = form.getValues("media") ?? [];
    if (result.success) {
      if (result.status === "already-ready") {
        // Firestore ya lo tenía listo: reflejarlo en el formulario.
        form.setValue("media", current.map((m) => (m.id === mediaId ? result.item : m)), { shouldValidate: true });
        notify.success("El archivo ya estaba listo.");
      } else {
        notify.success("Reintentando. Puede tardar unos segundos.");
      }
      return;
    }
    if (result.code === "missing-original") {
      // No hay nada que reprocesar: dejarlo en error para que el usuario lo elimine y lo vuelva a subir.
      form.setValue(
        "media",
        current.map((m) => (m.id === mediaId ? ({ ...m, data: { ...m.data, status: "error" } } as MediaItem) : m)),
        { shouldValidate: true },
      );
    }
    notify.error(result.error);
  };

  const saveMediaFiles = async (files: File[]) => {
    setIsOpen(false);

    const processFiles = async () => {
      if (!eventId) {
        await saveDraftEvent();
      }

      const currentEventId = form.getValues("id") as string;

      const uploadOptions = (file: File): UploadOptions => ({
        fileName: `deoptimized-media-${file.name}`,
        contentType: file.type,
        isPublic: true,
      });

      const supported = files.filter((f) => f.type.startsWith("video/") || f.type.startsWith("image/"));

      // Preparar → guardar los items "processing" en Firestore → recién entonces subir (ver uploadMediaPersistFirst).
      const { items, failedIds } = await uploadMediaPersistFirst(supported, {
        prepare: (file) => prepareUpload(file, "events", currentEventId, uploadOptions(file)),
        buildItem: async (file, prepared): Promise<MediaItem> => {
          if (file.type.startsWith("video/")) {
            const videoData = await getVideoData(file);
            return {
              id: crypto.randomUUID(),
              type: "video",
              data: {
                status: "processing",
                temporaryUrl: prepared.publicUrl,
                url: prepared.publicUrl,
                path: prepared.path,
                width: videoData.width,
                height: videoData.height,
                duration: videoData.duration,
                mimeType: file.type as "video/mp4" | "video/webm" | "video/ogg",
              },
            };
          }
          const imageData = await getImageData(file);
          return {
            id: crypto.randomUUID(),
            type: "image",
            data: {
              status: "processing",
              temporaryUrl: prepared.publicUrl,
              url: prepared.publicUrl,
              path: prepared.path,
              width: imageData.width,
              height: imageData.height,
              alt: file.name,
            },
          };
        },
        persist: async (newItems) => {
          const existing = form.getValues("media") ?? [];
          form.clearErrors("media");
          form.setValue("media", [...existing, ...newItems], { shouldValidate: true });
          try {
            await saveDraftEvent();
          } catch (error) {
            // Nada se subió: no dejar items "processing" huérfanos que un guardado posterior persistiría.
            form.setValue("media", existing, { shouldValidate: true });
            throw error;
          }
        },
        put: (file, prepared) => putToStorage(file, prepared, uploadOptions(file)),
        markError: async (ids) => {
          const current = form.getValues("media") ?? [];
          form.setValue(
            "media",
            current.map((m) => (ids.includes(m.id) ? ({ ...m, data: { ...m.data, status: "error" } } as MediaItem) : m)),
            { shouldValidate: true },
          );
          await saveDraftEvent();
        },
      });

      if (failedIds.length > 0) throw new Error(`partial-upload:${failedIds.length}`);
      return items;
    };

    notify.promise(processFiles(), {
      loading: "Subiendo archivos multimedia...",
      success: () => "Archivos subidos exitosamente.",
      error: (error) => {
        console.error("Error subiendo media:", error);
        const failed = error instanceof Error && error.message.match(/^partial-upload:(\d+)$/)?.[1];
        if (failed) return `No se pudieron subir ${failed} archivo(s). Quedaron marcados con error: elimínalos y vuelve a subirlos.`;
        return "Error al subir los archivos.";
      },
    });
  };
  return (
    <div className="space-y-4">
      <Controller
        name="mainImage"
        control={form.control}
        render={({ fieldState }) => {
          const imageValue = (mainImage && (mainImage as any).url)
            ? { status: mainImageStatus ?? "ready", temporaryUrl: mainImageTemporaryUrl, desktop: { url: (mainImage as any).url } }
            : {
                status: (mainImage as any)?.status ?? mainImageStatus,
                temporaryUrl: (mainImage as any)?.temporaryUrl ?? mainImageTemporaryUrl,
                desktop: (mainImage as any)?.desktop,
              };

          return (
            <ImageMainDropzone
              value={imageValue}
              onChange={saveMainImage}
              removeMainImage={removeMainImage}
              error={
                hasMainImagePreview
                  ? undefined
                  : fieldState.error?.message ??
                    (fieldState.invalid ? "Por favor selecciona una imagen principal" : undefined)
              }
            />
          );
        }}
      />
      {!hideMedia && (
        <Controller
          name="media"
          control={form.control}
          render={({ field: { value }, fieldState }) => (
            <MediaDropzone
              value={value ?? []}
              onChange={saveMediaFiles}
              removeMediaFile={removeMediaFile}
              onRetry={retryMedia}
              error={
                fieldState.error?.message ??
                (fieldState.invalid ? "Por favor revisa los archivos cargados" : undefined)
              }
            />
          )}
        />
      )}
    </div>
  );
};