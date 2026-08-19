
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
import { DoorOpen, Users, ExternalLink, ClipboardList } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

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

  const REGISTRATION_OPTIONS = [
    { value: "none",     Icon: DoorOpen,       label: "Sin registro",             desc: "Entrada libre. Solo mostramos la información del evento." },
    { value: "internal", Icon: Users,           label: "Registro en QueHayPaHacer",  desc: "La gente se apunta con su cuenta y tú ves la lista de asistentes." },
    { value: "external", Icon: ExternalLink,    label: "Sitio externo",              desc: "Enviamos a tu página de venta o formulario propio." },
    { value: "form",     Icon: ClipboardList,   label: "Formulario personalizado",   desc: "Diseña tus propias preguntas y descarga las respuestas." },
  ];

  return (
    <div className="space-y-4">

      {/* Card: tipo de registro */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        <p className="text-sm font-semibold text-[#09090B] mb-4">Tipo de registro</p>

        <Controller
          name="registrationType"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <RadioGroup
                onValueChange={(val) => {
                  field.onChange(val);
                  if (val !== "external") form.setValue("externalUrl", "");
                }}
                value={field.value}
                className="flex flex-col gap-2"
              >
                {REGISTRATION_OPTIONS.map(({ value, Icon, label, desc }) => {
                  const isFormOption = value === "form";
                  const isDisabled  = isFormOption && !isProfessional;
                  const isSelected  = field.value === value;

                  const card = (
                    <Label
                      key={value}
                      htmlFor={value}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border px-4 py-3 transition-all",
                        isDisabled
                          ? "cursor-not-allowed border-amber-200 bg-amber-50/60 opacity-60"
                          : isSelected
                          ? "cursor-pointer border-[#E63946] bg-[#FDF2F4]"
                          : "cursor-pointer border-[#E4E4E7] bg-white hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
                      )}
                    >
                      {/* Ícono */}
                      <span className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                        isSelected ? "bg-[#E63946] text-white" : "bg-[#F4F4F5] text-[#71717A]",
                      )}>
                        <Icon className="size-5" />
                      </span>

                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-semibold", isSelected ? "text-[#E63946]" : "text-[#09090B]")}>
                            {label}
                          </p>
                          {isFormOption && (
                            <span className="rounded-full bg-[#FFB703]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B45309]">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#71717A] mt-0.5">{desc}</p>
                        {isDisabled && (
                          <p className="mt-1 text-xs font-medium text-amber-600">Solo disponible para cuentas profesionales</p>
                        )}
                      </div>

                      {/* Radio */}
                      <RadioGroupItem
                        value={value}
                        id={value}
                        disabled={isDisabled}
                        className={cn(
                          "shrink-0",
                          isSelected ? "border-[#E63946] text-[#E63946]" : "border-[#A1A1AA]",
                          isDisabled && "pointer-events-none",
                        )}
                      />
                    </Label>
                  );

                  if (isDisabled) {
                    return (
                      <TooltipProvider key={value}>
                        <Tooltip>
                          <TooltipTrigger asChild>{card}</TooltipTrigger>
                          <TooltipContent side="top">Activa una cuenta profesional para usar esta opción</TooltipContent>
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

        {/* URL externa */}
        {registrationType === "external" && (
          <div className="mt-4 border-t border-[#F4F4F5] pt-4">
            <Controller
              name="externalUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid.toString()}>
                  <FieldLabel className="text-sm font-semibold text-[#09090B] mb-1.5 block">URL de registro externo</FieldLabel>
                  <Input
                    type="url"
                    placeholder="https://ejemplo.com/registro"
                    aria-label="URL de registro externo"
                    className="rounded-lg border-[#E4E4E7] h-11 focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                </Field>
              )}
            />
          </div>
        )}

        {/* Formulario personalizado */}
        {registrationType === "form" && (
          <div className="mt-4 border-t border-[#F4F4F5] pt-4 space-y-2">
            <p className="text-sm font-semibold text-[#09090B]">Constructor de formulario</p>
            <RegistrationFormBuilder
              value={form.watch("registrationEventForm") ?? {}}
              onChange={(value) => form.setValue("registrationEventForm", value, { shouldValidate: true })}
            />
            {/* Error cuando el formulario está vacío o tiene campos sin etiqueta */}
            {(form.formState.errors.registrationEventForm as { message?: string } | undefined)?.message && (
              <p className="text-xs text-[#E63946]">
                {(form.formState.errors.registrationEventForm as { message?: string }).message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Card: capacidad */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#09090B]">Capacidad limitada</p>
                <p className="text-xs text-[#71717A] mt-0.5">¿Tu evento tiene un cupo máximo de asistentes?</p>
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
                  <FieldLabel className="text-sm font-semibold text-[#09090B] mb-1.5 block">Número de cupos</FieldLabel>
                  <Input
                    type="number"
                    placeholder="Ej: 100"
                    aria-label="Capacidad"
                    min={1}
                    className="rounded-lg border-[#E4E4E7] h-11 focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20"
                    value={field.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") { field.onChange(0); return; }
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
            <div className="rounded-xl border border-dashed border-[#E4E4E7] bg-[#FAFAFC] p-3 text-xs text-[#71717A]">
              🎉 Evento abierto — cualquier persona puede registrarse sin límite de cupos.
            </div>
          )}

          {tracksRegistrations && (
            <Field>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#09090B]">¿Requiere asistencia?</p>
                  <p className="text-xs text-[#71717A] mt-0.5 max-w-sm">
                    Si lo activas, en la tabla de registros podrás confirmar la asistencia (check-in) de cada inscrito.
                  </p>
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

    </div>
  );
};
