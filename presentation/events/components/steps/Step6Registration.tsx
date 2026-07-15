"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { FormEventDto } from "@/application/dto/events/EventDto";
import {
  Field,
  FieldGroup,
  FieldDescription,
  FieldLabel,
  FieldError,
} from "@/app/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useAuth } from "@/app/store/auth/AuthContext";
import dynamic from "next/dynamic";

interface Step6RegistrationProps {
  form: UseFormReturn<FormEventDto>;
}

const RegistrationFormBuilder = dynamic(
  () => import("../form/RegistrationFormBuilder").then((mod) => mod.RegistrationFormBuilder),
  { ssr: false },
);

export const Step6Registration = ({ form }: Step6RegistrationProps) => {
  const { user } = useAuth();
  const isProfessional = user?.customClaims?.role === "professional";
  const registrationType = form.watch("registrationType");
  const capacityValue = form.watch("capacity");
  const isLimited = !!(capacityValue && capacityValue > 0);
  // El control de asistencia solo aplica cuando hay una lista de inscritos propia
  // (registro interno o por formulario). En "ninguno"/"externo" no hay a quién
  // pasarle lista, así que ocultamos el campo.
  const tracksRegistrations =
    registrationType === "internal" || registrationType === "form";
  const requiresAttendance = !!form.watch("requiresAttendance");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">
          Registro y capacidad de tu evento
        </h2>
        <p className="text-sm text-gray-500">
          ¿Cómo se podrán registrar los asistentes a tu evento? ¿Habrá un límite de capacidad?
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
                onValueChange={(val) => {
                  field.onChange(val);
                  if (val !== "external") form.setValue("externalUrl", "");
                }}
                value={field.value}
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  { value: "none", label: "Ninguno", desc: "Evento abierto" },
                  { value: "internal", label: "Registro interno", desc: "Registro básico en la plataforma" },
                  { value: "external", label: "Registro externo", desc: "Toma el control del registro en un sitio externo" },
                  { value: "form", label: "Formulario personalizado", desc: "Crea un formulario de registro personalizado" },
                ].map((option) => {
                  const isFormOption = option.value === "form";
                  const isDisabled = isFormOption && !isProfessional;

                  const card = (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex items-start gap-3 rounded border p-4 transition-colors ${
                        isDisabled
                          ? "cursor-not-allowed border-amber-400 bg-amber-50/50 opacity-60"
                          : field.value === option.value
                          ? "cursor-pointer border-black bg-gray-50"
                          : "cursor-pointer border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        disabled={isDisabled}
                        className={`mt-0.5 border-gray-400 text-black ${
                          isDisabled ? "pointer-events-none" : ""
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.desc}</p>
                        {isDisabled && (
                          <p className="mt-1 text-xs font-medium text-amber-600">
                            Solo disponible para cuentas profesionales
                          </p>
                        )}
                      </div>
                    </Label>
                  );

                  if (isDisabled) {
                    return (
                      <TooltipProvider key={option.value}>
                        <Tooltip>
                          <TooltipTrigger asChild>{card}</TooltipTrigger>
                          <TooltipContent side="top">
                            Activa una cuenta profesional para usar esta opción
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return card;
                })}
              </RadioGroup>
              {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
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
                  Ingresa el enlace donde los usuarios realizarán la inscripción.
                </FieldDescription>
                <Input
                  type="text"
                  placeholder="https://ejemplo.com/registro"
                  aria-label="URL de registro externo"
                  {...field}
                />
                {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
              </Field>
            )}
          />
        )}

        {registrationType === "form" && (
          <div className="space-y-2">
            <FieldLabel>Constructor de formulario de registro</FieldLabel>
            <RegistrationFormBuilder
              value={form.watch("registrationEventForm") ?? {}}
              onChange={(value) => form.setValue("registrationEventForm", value, { shouldValidate: true })}
            /> 
          </div>
        )}

        {/* Capacidad */}
        <Field>
          <div className="flex items-center justify-between">
            <div>
              <FieldLabel>Capacidad limitada</FieldLabel>
              <FieldDescription>
                ¿Tu evento tiene un cupo máximo de asistentes?
              </FieldDescription>
            </div>
            <Switch
              checked={isLimited}
              onCheckedChange={(checked) => {
                form.setValue("capacity", checked ? 50 : 0, { shouldValidate: true });
              }}
            />
          </div>
        </Field>

        {isLimited && (
          <Controller
            name="capacity"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid.toString()}>
                <FieldLabel>Número de cupos</FieldLabel>
                <FieldDescription>
                  ¿Cuántas personas pueden asistir a tu evento?
                </FieldDescription>
                <Input
                  type="number"
                  placeholder="Ej: 100"
                  aria-label="Capacidad"
                  min={1}
                  value={field.value || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      field.onChange(0);
                      return;
                    }
                    const numericValue = parseInt(val, 10);
                    field.onChange(isNaN(numericValue) ? 0 : numericValue);
                  }}
                />
                {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
              </Field>
            )}
          />
        )}

        {!isLimited && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 text-sm text-gray-500">
            🎉 Evento abierto — cualquier persona puede registrarse sin límite de cupos.
          </div>
        )}

        {/* Control de asistencia (check-in). Solo para eventos con lista propia. */}
        {tracksRegistrations && (
          <Field>
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel>¿Requiere asistencia?</FieldLabel>
                <FieldDescription>
                  Si lo activas, en la tabla de registros podrás confirmar la
                  asistencia (check-in) de cada inscrito. Si lo dejas desactivado,
                  solo verás la lista de inscritos.
                </FieldDescription>
              </div>
              <Switch
                checked={requiresAttendance}
                onCheckedChange={(checked) =>
                  form.setValue("requiresAttendance", checked, { shouldValidate: true })
                }
              />
            </div>
          </Field>
        )}
      </FieldGroup>
    </div>
  );
};