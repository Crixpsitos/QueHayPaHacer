"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { FormEventDto } from "@/application/dto/events/EventDto";
import dynamic from "next/dynamic";
import { Controller, type UseFormReturn } from "react-hook-form";
import { JSONContent } from "@tiptap/react";
import { RichTextEditorSkeleton } from "../editor/RichTextEditorSkeleton";

const RichTextEditor = dynamic(
  () => import("../editor/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <RichTextEditorSkeleton /> },
);

interface Step1Props {
  form: UseFormReturn<FormEventDto>;
}

export const Step1BasicInfo = ({ form }: Step1Props) => {
  // Observamos el campo en tiempo real para el contador de caracteres UX
  const titleValue = form.watch("title") || "";
  const shortDescriptionValue = form.watch("shortDescription") || "";

  return (
    <div className="space-y-6">
      {/* Cabecera optimizada con jerarquía tipográfica */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Información básica del evento
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cuéntanos un poco más sobre los detalles principales de tu parche.
        </p>
      </div>

      <FieldGroup className="space-y-5">
        {/* Campo: Título */}
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field  data-invalid={fieldState.invalid.toString()} className="w-full">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Título del evento
                </FieldLabel>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                  {titleValue.length}/60
                </span>
              </div>
              <Input 
                {...field} 
                id="title"
                maxLength={60}
                placeholder="Ej: Gran Concierto de Rock Local o Noche de Techno"
                className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 shadow-sm transition-all"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Campo: Descripción Corta con Contador UX */}
        <Controller
          name="shortDescription"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()} className="w-full">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="shortDescription" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Descripción corta
                </FieldLabel>
                {/* Contador sutil que alerta visualmente los caracteres */}
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                  {shortDescriptionValue.length}/150
                </span>
              </div>
              <Input 
                {...field} 
                id="shortDescription"
                maxLength={150}
                placeholder="Resume el gancho o la esencia de tu evento en una sola frase llamativa..."
                className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 shadow-sm transition-all"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Campo: Editor Enriquecido Largo */}
        <Controller
          name="description"
          control={form.control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()} className="w-full">
              <FieldLabel htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Descripción detallada
              </FieldLabel>
              {/* Contenedor estético para aislar el editor */}
              <div className="rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 transition-all shadow-sm">
                <RichTextEditor
                  value={value as JSONContent}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </div>
  );
};