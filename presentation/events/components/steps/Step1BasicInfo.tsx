"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { CreateEventDto } from "@/application/dto/events/EventDto";
import dynamic from "next/dynamic";
import { Controller, type UseFormReturn } from "react-hook-form";
import { JSONContent } from "@tiptap/react";  
import { RichTextEditorSkeleton } from "../editor/RichTextEditorSkeleton";

const RichTextEditor = dynamic(
  () => import("../editor/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> },
);

interface Step1Props {
  form: UseFormReturn<CreateEventDto>;
}

export const Step1BasicInfo = ({ form }: Step1Props) => {


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">
          Información básica del evento
        </h2>
        <p>Cuentanos un poco más sobre tu evento</p>
      </div>

      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Título</FieldLabel>
              <Input {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="shortDescription"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Descripción corta</FieldLabel>
              <Input {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Descripción</FieldLabel>
              <RichTextEditor
                value={value as JSONContent}
                onChange={onChange}
                onBlur={onBlur}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </div>
  );
};
