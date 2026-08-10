"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import { FormEventDto } from "@/application/dto/events/EventDto";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/app/components/ui/calendar";
import { Input } from "@/app/components/ui/input";
import { useState } from "react";

interface Step5DatesProps {
  form: UseFormReturn<FormEventDto>;
  maxDurationMs?: number;
}

type ShortcutKey = "2h" | "4h" | "allday" | null;

const SHORTCUTS = [
  { key: "2h" as const,     label: "2 horas" },
  { key: "4h" as const,     label: "4 horas" },
  { key: "allday" as const, label: "Todo el día" },
];

export const Step5Dates = ({ form, maxDurationMs }: Step5DatesProps) => {
  const startDate = form.watch("startDate");
  const endDate   = form.watch("endDate");
  const maxHours  = maxDurationMs ? Math.round(maxDurationMs / 3_600_000) : null;
  const [activeShortcut, setActiveShortcut] = useState<ShortcutKey>(null);

  const durationExceeded = Boolean(
    maxDurationMs && startDate && endDate &&
    new Date(endDate).getTime() - new Date(startDate).getTime() > maxDurationMs,
  );
  const durationErrorMsg = `La sesión no puede durar más de ${maxHours} h. Crea otra fecha para días adicionales.`;

  const applyShortcut = (key: ShortcutKey) => {
    if (!startDate || !key) return;
    const base = new Date(startDate);
    let end: Date;
    if (key === "2h") {
      end = new Date(base.getTime() + 2 * 3_600_000);
    } else if (key === "4h") {
      end = new Date(base.getTime() + 4 * 3_600_000);
    } else {
      end = new Date(base);
      end.setHours(23, 59, 0, 0);
    }
    setActiveShortcut(key);
    form.setValue("endDate", end.toISOString(), { shouldValidate: true });
  };

  // Detectar si el cierre ya no coincide con el atajo activo
  const getEffectiveShortcut = (): ShortcutKey => {
    if (!activeShortcut || !startDate || !endDate) return null;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    if (activeShortcut === "2h" && Math.abs(diff - 2 * 3_600_000) < 60_000) return "2h";
    if (activeShortcut === "4h" && Math.abs(diff - 4 * 3_600_000) < 60_000) return "4h";
    if (activeShortcut === "allday") {
      const end = new Date(endDate);
      if (end.getHours() === 23 && end.getMinutes() === 59) return "allday";
    }
    return null;
  };
  const currentShortcut = getEffectiveShortcut();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  const getTimeValue = (iso: string | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">

      {/* ── Card: Inicio ── */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        <p className="text-sm font-bold text-[#09090B] mb-4">Inicio</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha inicio */}
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => {
              const current = field.value ? new Date(field.value) : null;
              return (
                <Field data-invalid={fieldState.invalid.toString()}>
                  <FieldLabel className="text-xs font-semibold text-[#71717A] uppercase tracking-wide mb-1.5 block">Fecha</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start rounded-lg border-[#E4E4E7] bg-white text-left font-normal hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
                          !field.value && "text-[#A1A1AA]",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4 text-[#A1A1AA]" />
                        {current ? formatDate(field.value) : <span>dd / mm / aaaa</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={current || undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const newDate = new Date(date);
                          if (current) newDate.setHours(current.getHours(), current.getMinutes());
                          field.onChange(newDate.toISOString());
                          if (endDate) form.trigger("endDate");
                          // Recalcular cierre si hay atajo activo
                          if (activeShortcut) applyShortcut(activeShortcut);
                        }}
                        disabled={(date) => date <= new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              );
            }}
          />

          {/* Hora inicio */}
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid.toString()}>
                <FieldLabel className="text-xs font-semibold text-[#71717A] uppercase tracking-wide mb-1.5 block">Hora</FieldLabel>
                <Input
                  type="time"
                  value={getTimeValue(field.value)}
                  disabled={!field.value}
                  aria-label="Hora de inicio"
                  className="h-11 rounded-lg border-[#E4E4E7] bg-white text-[#09090B] focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20 disabled:opacity-40"
                  onChange={(e) => {
                    if (!field.value || !e.target.value) return;
                    const [hour, minute] = e.target.value.split(":");
                    const newDate = new Date(field.value);
                    newDate.setHours(parseInt(hour, 10), parseInt(minute, 10));
                    field.onChange(newDate.toISOString());
                    if (endDate) form.trigger("endDate");
                    if (activeShortcut) applyShortcut(activeShortcut);
                  }}
                />
              </Field>
            )}
          />
        </div>
      </div>

      {/* ── Card: Cierre ── */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        {/* Header con atajos */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <p className="text-sm font-bold text-[#09090B] mr-2">Cierre</p>
          {SHORTCUTS.map(({ key, label }) => {
            const isActive = currentShortcut === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyShortcut(key)}
                disabled={!startDate}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                  isActive
                    ? "border-[#E63946] bg-[#FDF2F4] text-[#E63946]"
                    : "border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#A1A1AA] hover:text-[#09090B]",
                )}
              >
                <Clock className="size-3 shrink-0" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha cierre */}
          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => {
              const current = field.value ? new Date(field.value) : null;
              return (
                <Field data-invalid={(fieldState.invalid || durationExceeded).toString()}>
                  <FieldLabel className="text-xs font-semibold text-[#71717A] uppercase tracking-wide mb-1.5 block">
                    {maxHours ? `Fecha (máx. ${maxHours} h)` : "Fecha"}
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start rounded-lg border-[#E4E4E7] bg-white text-left font-normal hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
                          !field.value && "text-[#A1A1AA]",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4 text-[#A1A1AA]" />
                        {current ? formatDate(field.value) : <span>dd / mm / aaaa</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={current || undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const newDate = new Date(date);
                          if (current) newDate.setHours(current.getHours(), current.getMinutes());
                          field.onChange(newDate.toISOString());
                          setActiveShortcut(null);
                          form.trigger("endDate");
                        }}
                        disabled={(date) => {
                          if (!startDate) return date <= new Date(new Date().setHours(0, 0, 0, 0));
                          const startLimit = new Date(startDate);
                          startLimit.setHours(0, 0, 0, 0);
                          if (date < startLimit) return true;
                          if (maxDurationMs) {
                            const maxEnd = new Date(new Date(startDate).getTime() + maxDurationMs);
                            maxEnd.setHours(0, 0, 0, 0);
                            if (date > maxEnd) return true;
                          }
                          return false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError>
                    {durationExceeded ? durationErrorMsg : fieldState.error?.message}
                  </FieldError>
                </Field>
              );
            }}
          />

          {/* Hora cierre */}
          <Controller
            name="endDate"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel className="text-xs font-semibold text-[#71717A] uppercase tracking-wide mb-1.5 block">Hora</FieldLabel>
                <Input
                  type="time"
                  value={getTimeValue(field.value)}
                  disabled={!field.value}
                  aria-label="Hora de cierre"
                  className="h-11 rounded-lg border-[#E4E4E7] bg-white text-[#09090B] focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20 disabled:opacity-40"
                  onChange={(e) => {
                    if (!field.value || !e.target.value) return;
                    const [hour, minute] = e.target.value.split(":");
                    const newDate = new Date(field.value);
                    newDate.setHours(parseInt(hour, 10), parseInt(minute, 10));
                    field.onChange(newDate.toISOString());
                    setActiveShortcut(null);
                    form.trigger("endDate");
                  }}
                />
              </Field>
            )}
          />
        </div>

        {/* Texto de ayuda */}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#71717A]">
          <Clock className="size-3.5 shrink-0" />
          Los atajos calculan el cierre a partir del inicio.
        </p>
      </div>

    </div>
  );
};


interface Step5DatesProps {
  form: UseFormReturn<FormEventDto>;
  /** Si se define, la fecha de fin no puede superar startDate + maxDurationMs (sesiones). */
  maxDurationMs?: number;
}
