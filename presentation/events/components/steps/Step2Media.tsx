"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { CreateEventDto } from "@/application/dto/events/EventDto";
import { FieldGroup } from "@/app/components/ui/field";
import { MediaDropzone } from "../Dropzone/MediaDropzone";
import { ImageMainDropzone } from "../Dropzone/ImageMainDropzone";

interface Step2Props {
  form: UseFormReturn<CreateEventDto>;
}

export const Step2Media = ({ form }: Step2Props) => {
  const removeMainImage = () => {
    form.setValue("mainImage", null, { shouldValidate: true });
  };

  const removeMediaFile = (name: string) => {
    const current = (form.getValues("media") as File[]) ?? [];
    form.setValue(
      "media",
      current.filter((f) => f.name !== name),
      { shouldValidate: true },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">Medios de tu evento</h2>
        <p className="text-sm text-gray-500">
          Selecciona las imágenes que quieras utilizar para tu evento
        </p>
      </div>

      <FieldGroup>
        <Controller
          name="mainImage"
          control={form.control}
          render={({ field: { value, onChange }, fieldState }) => (
            <ImageMainDropzone
              value={value}
              onChange={onChange}
              removeMainImage={removeMainImage}
              error={
                fieldState.error?.message ??
                (fieldState.invalid
                  ? "Por favor selecciona una imagen"
                  : undefined)
              }
            />
          )}
        />
        <Controller
          name="media"
          control={form.control}
          render={({ field: { value, onChange }, fieldState }) => (
            <MediaDropzone
              value={(value as File[]) ?? []}
              onChange={onChange}
              removeMediaFile={removeMediaFile}
              error={
                fieldState.error?.message ??
                (fieldState.invalid
                  ? "Por favor selecciona una imagen"
                  : undefined)
              }
            />
          )}
        />
      </FieldGroup>
    </div>
  );
};
