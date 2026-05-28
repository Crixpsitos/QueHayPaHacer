"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { FormEventDto, MediaItem } from "@/application/dto/events/EventDto";
import { FieldGroup } from "@/app/components/ui/field";
import { MediaDropzone } from "../Dropzone/MediaDropzone";
import { ImageMainDropzone } from "../Dropzone/ImageMainDropzone";
import { notify } from "@/presentation/shared/lib/notify";
import { saveEventMediaToStorage } from "@/app/actions/events/save-event-media-to-storage.action";
import { getVideoData } from "../../lib/video/getVideoData";
import { getImageData } from "../../lib/image/getImageData";
import { uploadToGoogleStorage } from "../../lib/upload/uploadToGoogleStorage";

interface Step2Props {
  form: UseFormReturn<FormEventDto>;
  saveDraftEvent: (notifyMessage: string) => Promise<void>;
}

export const Step2Media = ({ form, saveDraftEvent }: Step2Props) => {
  const eventId = form.watch("id") as string;

  const removeMainImage = () => {
    form.setValue("mainImage", {}, { shouldValidate: true });
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

  const processFile = async () => {
    if (!eventId) {
      await saveDraftEvent("Hemos guardado tu evento para que puedas editarlo después.");
    }

    const [imageData, result] = await Promise.all([
      getImageData(file),
      uploadToGoogleStorage(file, "events", eventId),
    ]);

      form.clearErrors("mainImage")

    form.setValue("mainImage", {
      desktop: {
        url: result.publicUrl,
        path: result.path,
        width: imageData.width,
        height: imageData.height,
        alt: `Imagen principal de ${form.getValues("title")}`,
      },
    }, { shouldValidate: true }) 

    await new Promise(resolve => setTimeout(resolve, 0))

    await saveDraftEvent("Hemos guardado tu evento para que puedas editarlo después.");

    return result;
  };

  await notify.promise(
    processFile(),
    {
      loading: "Subiendo y guardando imagen...",
      success: () => "Imagen guardada exitosamente.",
      error: (error) => {
        console.error("Error:", error);
        return "Error al subir la imagen principal.";
      },
    },
    { description: "Por favor espera..." },
  );
};

  const saveMediaFiles = async (files: File[]) => {
    const processFiles = async () => {
      if (!eventId) {
        await saveDraftEvent(
          "Hemos guardado tu evento para que puedas editarlo después.",
        );
      }

      const formData = new FormData();
      formData.append("eventId", form.getValues("id") as string);

      files.forEach((file) => {
        formData.append("media[]", file);
      });

      const result = await saveEventMediaToStorage(formData);

      if (result.success) {
        const processedMedia: MediaItem[] = [];
        let index = 0;

        for (const item of result.media) {
          const file = files[index];
          const type = file.type;

          if (type.startsWith("video/")) {
            const videoData = await getVideoData(file);

            processedMedia.push({
              id: item.id,
              type: "video" as const,
              data: {
                url: item.url,
                width: videoData.width,
                height: videoData.height,
                duration: videoData.duration,
                mimeType: videoData.mimeType as
                  | "video/mp4"
                  | "video/webm"
                  | "video/ogg",
              },
            });
          } else if (type.startsWith("image/")) {
            const imageData = await getImageData(file);

            processedMedia.push({
              id: item.id,
              type: "image" as const,
              data: {
                url: item.url,
                path: item.path || "",
                width: imageData.width,
                height: imageData.height,
                alt: file.name,
              },
            });
          }

          index++;
        }

        form.setValue("media", processedMedia, { shouldValidate: true });

        return result;
      } else {
        throw new Error(result.error ?? "Error al subir los archivos.");
      }
    };

    notify.promise(
      processFiles(),
      {
        loading: "Subiendo archivos y optimizando multimedia...",
        success: () => `Archivos subidos exitosamente.`,
        error: "Error al subir los archivos.",
      },
      { description: "Por favor espera..." },
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera optimizada con mejor jerarquía tipográfica */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Medios de tu evento
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Selecciona las piezas gráficas que le darán identidad a tu evento.
        </p>
      </div>

      <FieldGroup className="space-y-8">
        <Controller
          name="mainImage"
          control={form.control}
          render={({ field: { value }, fieldState }) => (
            <ImageMainDropzone
              value={value?.desktop?.url ?? null}
              onChange={saveMainImage}
              removeMainImage={removeMainImage}
              error={
                fieldState.error?.message ??
                (fieldState.invalid
                  ? "Por favor selecciona una imagen principal"
                  : undefined)
              }
            />
          )}
        />
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
                (fieldState.invalid
                  ? "Por favor revisa los archivos cargados"
                  : undefined)
              }
            />
          )}
        />
      </FieldGroup>
    </div>
  );
};
