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
import { uploadToGoogleStorage } from "../../lib/upload/uploadToGoogleStorage";
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

    const result = await uploadToGoogleStorage(file, "events", currentEventId, {
      fileName: `deoptimized-main-image-${file.name}`,
      contentType: file.type,
      isPublic: true,
    });
    
    form.clearErrors("mainImage");

    // set UI state: we uploaded a temporary public URL, optimization happens async
    // store path + url + status + temporaryUrl inside mainImage object
    form.setValue("mainImage", { url: result.publicUrl, path: result.path, status: "processing", temporaryUrl: result.publicUrl }, { shouldValidate: false, shouldDirty: true });

    await saveDraftEvent();

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
  const saveMediaFiles = async (files: File[]) => {
    setIsOpen(false);

    const processFiles = async () => {
      if (!eventId) {
        await saveDraftEvent();
      }

      const currentEventId = form.getValues("id") as string;

      const uploadResults = await Promise.all(
        files.map((file) =>
          uploadToGoogleStorage(file, "events", currentEventId, {
            fileName: `deoptimized-media-${file.name}`,
            contentType: file.type,
            isPublic: true,
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
      form.clearErrors("media");
      form.setValue("media", [...existing, ...processedMedia], {
        shouldValidate: true,
      });

      await saveDraftEvent();

      return processedMedia;
    };

    notify.promise(processFiles(), {
      loading: "Subiendo archivos multimedia...",
      success: () => "Archivos subidos exitosamente.",
      error: (error) => {
        console.error("Error subiendo media:", error);
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