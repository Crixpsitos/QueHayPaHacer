"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { CreateEventDto } from "@/application/dto/events/EventDto";
import {
  Field,
  FieldGroup,
  FieldDescription,
  FieldLabel,
} from "@/app/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import dynamic from "next/dynamic";

interface Step6RegistrationProps {
  form: UseFormReturn<CreateEventDto>;
}

const RegistrationFormBuilder = dynamic(
  () => import("../form/RegistrationFormBuilder").then((mod) => mod.RegistrationFormBuilder),
  { ssr: false },
);

export const Step6Registration = ({ form }: Step6RegistrationProps) => {
  const registrationType = form.watch("registrationType");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">
          Registro y capacidad de tu evento
        </h2>
        <p className="text-sm text-gray-500">
          ¿Como se podran registrar los asistentes a tu evento? ¿Habrá un límite
          de capacidad?
        </p>
      </div>
      <FieldGroup>

          <Controller
            name="registrationType"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid.toString()}>
                <FieldLabel>Tipo de registro</FieldLabel>
                <FieldDescription>
                  ¿Cómo se registrarán los asistentes a tu evento?
                </FieldDescription>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {[
                    {
                      value: "none",
                      label: "Ninguno",
                      desc: "Evento abierto",
                    },
                    {
                      value: "internal",
                      label: "Registro interno",
                      desc: "Registro básico en la plataforma",
                    },
                    {
                      value: "external",
                      label: "Registro externo",
                      desc: "Toma el control del registro en un sitio externo",
                    },
                    {
                      value: "form",
                      label: "Formulario personalizado",
                      desc: "Crea un formulario de registro personalizado",
                    },
                  ].map((option) => (
                    <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded border p-4 transition-colors ${
                      field.value === option.value
                        ? "border-black bg-gray-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="mt-0.5 border-gray-400 text-black"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                  </Label>
                  ))}
                </RadioGroup>
              </Field>
            )}
          />

            {registrationType === "external" && (
              <Controller
                name="externalUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid.toString()}>
                    <FieldLabel>URL de registro externo</FieldLabel>
                    <FieldDescription>
                      ¿Cómo se registrarán los asistentes a tu evento?
                    </FieldDescription>
                    <Input
                      type="text"
                      placeholder="Ingresa la URL"
                      aria-label="URL de registro externo"
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldLabel className="text-destructive">{fieldState?.error?.message}</FieldLabel>
                    )}
                  </Field>
                )}
              />
            )}

            {registrationType === "form" && (
              <div>
                <FieldLabel className="mb-3">Constructor de formulario de registro</FieldLabel>
                <RegistrationFormBuilder
                  value={form.watch("registrationEventForm")}
                  onChange={(value) => form.setValue("registrationEventForm", value)}
                /> 
              </div>
            )}

          <Controller
          name="capacity"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <FieldLabel>Capacidad (opcional)</FieldLabel>
              <FieldDescription>
                ¿Cuántas personas pueden asistir a tu evento?
              </FieldDescription>
              <Input
                type="number"
                placeholder="Ingresa la capacidad"
                aria-label="Capacidad"
                min={0}
                {...field}
                onChange={(e) => {
                  const value = e.target.value;
                    if (value === "") {
                        return;
                    }
                    const numericValue = parseInt(value, 10);
                    if (isNaN(numericValue)) {
                        return;
                    }
                    field.onChange(numericValue);
                }} 
              />
              {fieldState.invalid && (
                <FieldLabel className="text-destructive">{fieldState?.error?.message}</FieldLabel>
              )}
            </Field>
          )}
          />
        
      </FieldGroup>
    </div>
  );
};
