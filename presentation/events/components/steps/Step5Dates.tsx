"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import {
  FieldGroup,
  Field,
  FieldDescription,
  FieldLabel,
  FieldError,
} from "@/app/components/ui/field";
import { FormEventDto } from "@/application/dto/events/EventDto";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/app/components/ui/calendar";
import { Input } from "@/app/components/ui/input";

interface Step5DatesProps {
  form: UseFormReturn<FormEventDto>;
  /** Si se define, la fecha de fin no puede superar startDate + maxDurationMs (sesiones). */
  maxDurationMs?: number;
}

export const Step5Dates = ({ form, maxDurationMs }: Step5DatesProps) => {
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const maxHours = maxDurationMs ? Math.round(maxDurationMs / 3_600_000) : null;

  // Violación de duración calculada en vivo desde los valores observados. No
  // depende del resolver (evita timing raro de RHF): se ve apenas se supera.
  const durationExceeded = Boolean(
    maxDurationMs &&
      startDate &&
      endDate &&
      new Date(endDate).getTime() - new Date(startDate).getTime() >
        maxDurationMs,
  );
  const durationErrorMsg = `La sesión no puede durar más de ${maxHours} h. Crea otra fecha para días adicionales.`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">Fechas y estado</h2>
        <p className="text-sm text-gray-500">
          ¿Cuándo y cómo se llevará a cabo el evento?
        </p>
      </div>
      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => {
              const currentValues = field.value ? new Date(field.value) : null;

              const timeInputValue = currentValues
                ? `${String(currentValues.getHours()).padStart(2, "0")}:${String(currentValues.getMinutes()).padStart(2, "0")}`
                : "";

              return (
                <Field data-invalid={fieldState.invalid.toString()}>
                  <FieldLabel>Fecha de inicio</FieldLabel>
                  <FieldDescription>
                    ¿Cuándo se llevará a cabo el evento?
                  </FieldDescription>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start border-gray-300 text-left font-normal hover:bg-gray-50",
                          !field.value && "text-gray-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentValues ? (
                          currentValues.toLocaleString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          <span>Selecciona la fecha de inicio</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={currentValues || undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const newDate = new Date(date);
                          if (currentValues) {
                            newDate.setHours(
                              currentValues.getHours(),
                              currentValues.getMinutes(),
                            );
                          }
                          field.onChange(newDate?.toISOString());
                          if (endDate) {
                            form.trigger("endDate");
                          }
                        }}
                        disabled={(date) =>
                          date <= new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    className="mt-2 border-gray-300 focus:border-black focus:ring-1 focus:ring-black bg-background text-foreground"
                    placeholder="Hora de inicio"
                    onChange={(e) => {
                      if (!field.value || !e.target.value) return;

                      const parts = e.target.value.split(":");
                      if (parts.length !== 2) return;

                      const [hour, minute] = parts;
                      const newDate = new Date(field.value);

                      newDate.setHours(
                        parseInt(hour, 10),
                        parseInt(minute, 10),
                      );
                      field.onChange(newDate.toISOString());
                      if (endDate) {
                        form.trigger("endDate");
                      }
                    }}
                    value={timeInputValue}
                    aria-label="Hora de inicio"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              );
            }}
          />
          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => {
              const currentValues = field.value ? new Date(field.value) : null;

              const timeInputValue = currentValues
                ? `${String(currentValues.getHours()).padStart(2, "0")}:${String(currentValues.getMinutes()).padStart(2, "0")}`
                : "";

              return (
                <Field
                  data-invalid={(
                    fieldState.invalid || durationExceeded
                  ).toString()}
                >
                  <FieldLabel>Fecha de finalización</FieldLabel>
                  <FieldDescription>
                    {maxHours
                      ? `Máximo ${maxHours} h después del inicio.`
                      : "¿Cuándo se llevará a cabo el evento?"}
                  </FieldDescription>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start border-gray-300 text-left font-normal hover:bg-gray-50",
                          !field.value && "text-gray-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentValues ? (
                          currentValues.toLocaleString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          <span>Selecciona la fecha de finalización</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={currentValues || undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          const newDate = new Date(date);
                          if (currentValues) {
                            newDate.setHours(
                              currentValues.getHours(),
                              currentValues.getMinutes(),
                            );
                          }
                          field.onChange(newDate.toISOString());
                          form.trigger("endDate");
                        }}
                        disabled={(date) => {
                          if (!startDate) {
                            return (
                              date <= new Date(new Date().setHours(0, 0, 0, 0))
                            );
                          }
                          const startLimit = new Date(startDate);
                          startLimit.setHours(0, 0, 0, 0);
                          if (date < startLimit) return true;
                          if (maxDurationMs) {
                            const maxEndDay = new Date(
                              new Date(startDate).getTime() + maxDurationMs,
                            );
                            maxEndDay.setHours(0, 0, 0, 0);
                            if (date > maxEndDay) return true;
                          }
                          return false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    className="mt-2 border-gray-300 focus:border-black focus:ring-1 focus:ring-black bg-background text-foreground"
                    placeholder="Hora de finalización"
                    onChange={(e) => {
                      if (!field.value || !e.target.value) return;

                      const parts = e.target.value.split(":");
                      if (parts.length !== 2) return;

                      const [hour, minute] = parts;
                      const newDate = new Date(field.value);

                      newDate.setHours(
                        parseInt(hour, 10),
                        parseInt(minute, 10),
                      );
                      field.onChange(newDate.toISOString());
                      form.trigger("endDate");
                    }}
                    value={timeInputValue}
                    aria-label="Hora de finalización"
                  />
                  <FieldError>
                    {durationExceeded
                      ? durationErrorMsg
                      : fieldState.error?.message}
                  </FieldError>
                </Field>
              );
            }}
          />
        </div>
      </FieldGroup>
    </div>
  );
};