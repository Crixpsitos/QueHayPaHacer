"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
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
    <div className="space-y-4">

      {/* ── Card 1: Título + Gancho corto ─── */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card space-y-5">
        {/* Título */}
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()} className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel htmlFor="title" className="text-sm font-semibold text-[#09090B]">
                  Título del evento
                </FieldLabel>
                <span className="text-xs text-[#A1A1AA] tabular-nums">{titleValue.length}/60</span>
              </div>
              <Input
                {...field}
                id="title"
                maxLength={60}
                placeholder="Ej: Gran Concierto de Rock Local"
                className="w-full rounded-lg border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-[#A1A1AA] focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20 shadow-none transition-all"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Gancho corto */}
        <Controller
          name="shortDescription"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()} className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel htmlFor="shortDescription" className="text-sm font-semibold text-[#09090B]">
                  Gancho corto
                </FieldLabel>
                <span className="text-xs text-[#A1A1AA] tabular-nums">{shortDescriptionValue.length}/150</span>
              </div>
              <Textarea
                {...field}
                id="shortDescription"
                maxLength={150}
                placeholder="¿Por qué no te lo puedes perder?"
                className="w-full rounded-lg border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-[#A1A1AA] focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20 min-h-16 resize-none transition-all"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <p className="mt-1.5 text-xs text-[#71717A]">
                Una frase que se lee de un vistazo. Aparece bajo el título en las tarjetas.
              </p>
            </Field>
          )}
        />
      </div>

      {/* ── Card 2: Descripción detallada ─── */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        <Controller
          name="description"
          control={form.control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()} className="w-full">
              <FieldLabel htmlFor="description" className="text-sm font-semibold text-[#09090B] mb-2 block">
                Descripción detallada
              </FieldLabel>
              <div className="rounded-lg overflow-hidden border border-[#E4E4E7] bg-white focus-within:border-[#E63946] transition-colors">
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
      </div>

    </div>
  );
};