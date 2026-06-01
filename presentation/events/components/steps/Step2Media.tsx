"use client";

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
}

export const Step2Media = ({ form, saveDraftEvent }: Step2Props) => {
  const eventId = form.watch("id") as string;
const setIsOpen = useEventModalStore((state) => state.setIsOpen);


  

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
    setIsOpen(false);

    const processFile = async () => {

      if (!eventId) {
        await saveDraftEvent();
      }
      
      const currentEventId = form.getValues("id") as string;

      const [imageData, result] = await Promise.all([
        getImageData(file),
        uploadToGoogleStorage(file, "events", currentEventId),
      ]);
      
      form.clearErrors("mainImage");


      form.setValue(
        "mainImage",
        {
          desktop: {
            url: result.publicUrl,
            path: result.path,
            width: imageData.width,
            height: imageData.height,
            alt: `Imagen principal de ${form.getValues("title")}`,
          },
          tablet: null,
          mobile: null,
        },
        { shouldValidate: true },
      );

      // await new Promise((resolve) => setTimeout(resolve, 0));
      await saveDraftEvent();

      return result;
    };

    await notify.promise(processFile(), {
      loading: "Subiendo y guardando imagen, por favor espera...",
      success: () => "Imagen guardada exitosamente.",
      error: (error) => {
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
        files.map((file) => uploadToGoogleStorage(file, "events", currentEventId))
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
              url: result.publicUrl,
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
      form.setValue("media", [...existing, ...processedMedia], { shouldValidate: true });

      await new Promise((resolve) => setTimeout(resolve, 0));
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
    <div className="space-y-6">
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