"use client";

import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldGroup,
  FieldDescription,
  FieldLabel,
  FieldError,
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button/button";

interface Step7PricingProps {
  form: UseFormReturn<FormEventDto>;
}

const formatWithDots = (value: number | string): string => {
  const raw = String(value).replace(/\D/g, "");
  if (!raw) return "";
  return parseInt(raw, 10).toLocaleString("es-CO").replace(/,/g, ".");
};

const parseDots = (formatted: string): number => {
  const raw = formatted.replace(/\./g, "");
  const n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
};

export function Step7Pricing({ form }: Step7PricingProps) {
  const isFree = form.watch("price.isFree");
  const registrationType = form.watch("registrationType");
  const [displayAmount, setDisplayAmount] = useState<string>(() => {
    const initial = form.getValues("price.amount");
    return initial ? formatWithDots(initial) : "";
  });
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const registrationTypeLabel: Record<string, string> = {
    none: "Sin registro",
    internal: "Registro en plataforma",
    external: "Registro externo",
    form: "Formulario personalizado",
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Payment gateway warning modal */}
      {showPaymentWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            setShowPaymentWarning(false);
            form.setValue("price.isFree", true, { shouldValidate: true });
            form.setValue("price.amount", 0, { shouldValidate: true });
            setDisplayAmount("");
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Pasarela de pago no disponible</p>
                <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
                  Hemos detectado que tu evento tiene un precio, pero el tipo de registro
                  seleccionado es <strong>"{registrationType ? (registrationTypeLabel[registrationType] ?? registrationType) : "desconocido"}"</strong>. Actualmente no contamos con
                  pasarela de pago integrada para este método. Si deseas cobrar por el evento,
                  debes usar el tipo de registro <strong>Externo</strong> y gestionar los pagos desde tu
                  propia plataforma.
                </p>
              </div>
            </div>
            <div className="px-6 py-5">
              <Button
                className="w-full"
                onClick={() => {
                  setShowPaymentWarning(false);
                  form.setValue("price.isFree", true, { shouldValidate: true });
                  form.setValue("price.amount", 0, { shouldValidate: true });
                  setDisplayAmount("");
                }}
              >
                De acuerdo
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-950">Precio del evento</h2>
        <p className="text-sm text-gray-500 mt-1">
          Indica si el evento es gratuito o tiene un costo monetario para los asistentes.
        </p>
      </div>

      <FieldGroup className="space-y-6">
        <Controller
          name="price.isFree"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-row items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm gap-4"
              data-invalid={fieldState.invalid.toString()}
            >
              <div className="flex flex-col gap-1 max-w-[80%]">
                <FieldLabel className="text-sm font-semibold text-gray-900">
                  ¿Es un evento gratuito?
                </FieldLabel>
                <FieldDescription className="text-xs text-gray-500 leading-normal">
                  Activa esta casilla si los asistentes no necesitan pagar ninguna tarifa para ingresar.
                </FieldDescription>
              </div>
              <Switch
                id="free-event"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    form.setValue("price.amount", 0, { shouldValidate: true });
                    setDisplayAmount("");
                  } else if (registrationType !== "external") {
                    // Paid event with non-external registration → warn
                    setShowPaymentWarning(true);
                  }
                }}
                className="data-[state=checked]:bg-black shrink-0"
              />
            </Field>
          )}
        />

        {!isFree && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 items-start animate-in fade-in duration-200">
            
            {/* Campo de Precio con formato de puntos */}
            <Controller
              name="price.amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  className="flex flex-col gap-2 min-h-[110px]"
                  data-invalid={fieldState.invalid.toString()}
                >
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="text-sm font-semibold text-gray-800">
                      Precio de la entrada
                    </FieldLabel>
                    <FieldDescription className="text-xs text-gray-500">
                      Establece el valor unitario por registro.
                    </FieldDescription>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none select-none">
                      $
                    </span>
                    <Input
                      inputMode="numeric"
                      placeholder="0"
                      className="h-10 pl-6 text-sm bg-background border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-lg shadow-sm w-full tabular-nums"
                      value={displayAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\./g, "").replace(/\D/g, "");
                        const formatted = raw ? formatWithDots(raw) : "";
                        setDisplayAmount(formatted);
                        field.onChange(raw ? parseDots(formatted) : 0);
                      }}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  </div>
                  {displayAmount && (
                    <p className="text-xs text-gray-400 font-mono">
                      = {parseDots(displayAmount).toLocaleString("es-CO", { style: "currency", currency: form.watch("price.currency") || "COP", maximumFractionDigits: 0 })}
                    </p>
                  )}
                  {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                </Field>
              )}
            />

            {/* Campo de Moneda - Solo COP por ahora (MVP) */}
            <Controller
              name="price.currency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  className="flex flex-col gap-2 min-h-[110px]"
                  data-invalid={fieldState.invalid.toString()}
                >
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="text-sm font-semibold text-gray-800">
                      Divisa / Moneda
                    </FieldLabel>
                    <FieldDescription className="text-xs text-gray-500">
                      Tipo de moneda para la pasarela de pagos.
                    </FieldDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 border border-gray-200">
                      COP (CO$)
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      Única moneda disponible en el MVP
                    </span>
                  </div>
                  <input type="hidden" name="price.currency" value="COP" />
                  {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
                </Field>
              )}
            />

          </div>
        )}
      </FieldGroup>
    </div>
  );
}