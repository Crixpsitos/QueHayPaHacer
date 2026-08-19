"use client";

import { useState, useEffect } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { Gift, Ticket, Info, ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

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

const PRICE_PRESETS = [10_000, 25_000, 50_000];

export function Step7Pricing({ form }: Step7PricingProps) {
  const isFree = form.watch("price.isFree");
  const registrationType = form.watch("registrationType");
  const isExternal = registrationType === "external";

  const [displayAmount, setDisplayAmount] = useState<string>(() => {
    const initial = form.getValues("price.amount");
    return initial ? formatWithDots(initial) : "";
  });
  // Controla si mostramos el modal de advertencia (solo cuando pagado + no externo)
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  // Cuando el tipo de registro cambia a uno incompatible con "Pagado", forzar a "Gratis"
  useEffect(() => {
    if (registrationType !== "external" && !form.getValues("price.isFree")) {
      form.setValue("price.isFree", true, { shouldValidate: true });
      form.setValue("price.amount", 0, { shouldValidate: true });
      setDisplayAmount("");
    }
    // Solo reaccionamos al cambio de registrationType, no al precio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationType]);

  const handleSelectFree = () => {
    form.setValue("price.isFree", true, { shouldValidate: true });
    form.setValue("price.amount", 0, { shouldValidate: true });
    setDisplayAmount("");
    // No cambiamos registrationType: gratis admite cualquier tipo de registro
  };

  const handleSelectPaid = () => {
    if (isExternal) {
      // Ya tiene registro externo: solo marcamos como pagado
      form.setValue("price.isFree", false, { shouldValidate: true });
    } else {
      // Registro no externo: mostrar modal explicativo SIN cambiar aún el estado
      setShowPaymentWarning(true);
    }
  };

  // Acción "Usar registro externo" en el modal
  const handleUseExternal = () => {
    form.setValue("registrationType", "external", { shouldValidate: true });
    form.setValue("price.isFree", false, { shouldValidate: true });
    setShowPaymentWarning(false);
  };

  // Cancelar modal: no cambia nada (isFree permanece true)
  const handleCancelWarning = () => {
    setShowPaymentWarning(false);
  };

  return (
    <div className="space-y-4">

      {/* ── Modal: Pagado seleccionado pero registro ≠ externo ── */}
      {showPaymentWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleCancelWarning}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-6 pt-6 pb-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF8E7]">
                <Info className="size-5 text-[#E09F00]" />
              </span>
              <div>
                <p className="text-base font-bold text-[#09090B]">Los eventos pagados requieren registro externo</p>
                <p className="mt-1.5 text-sm text-[#71717A] leading-relaxed">
                  QueHayPaHacer no tiene pasarela de pagos integrada. Si tu evento es pagado, necesitas usar registro externo y gestionar por tu cuenta el cobro de las entradas.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={handleUseExternal}
                className="w-full rounded-xl bg-[#E63946] hover:bg-[#9B0A26] px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-primary-glow"
              >
                Usar registro externo
              </button>
              <button
                type="button"
                onClick={handleCancelWarning}
                className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-2.5 text-sm font-medium text-[#09090B] hover:bg-[#FAFAFC] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card: opciones Gratis / Pagado ── */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        <p className="text-sm font-semibold text-[#09090B] mb-4">¿Cuánto cuesta entrar?</p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Gratis */}
          <button
            type="button"
            onClick={handleSelectFree}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
              isFree
                ? "border-[#E63946] bg-[#FDF2F4]"
                : "border-[#E4E4E7] bg-white hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
            )}
          >
            <span className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              isFree ? "bg-[#E63946] text-white" : "bg-[#F4F4F5] text-[#71717A]",
            )}>
              <Gift className="size-5" />
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", isFree ? "text-[#E63946]" : "text-[#09090B]")}>Gratis</p>
              <p className="text-xs text-[#71717A] mt-0.5">Sin costo de entrada</p>
            </div>
          </button>

          {/* Pagado */}
          <button
            type="button"
            onClick={handleSelectPaid}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
              !isFree
                ? "border-[#E63946] bg-[#FDF2F4]"
                : "border-[#E4E4E7] bg-white hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
            )}
          >
            <span className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              !isFree ? "bg-[#E63946] text-white" : "bg-[#F4F4F5] text-[#71717A]",
            )}>
              <Ticket className="size-5" />
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", !isFree ? "text-[#E63946]" : "text-[#09090B]")}>Pagado</p>
              <p className="text-xs text-[#71717A] mt-0.5">Indica el valor por persona</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Card: valor (solo cuando pagado) ── */}
      {!isFree && (
        <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card space-y-5">

          <Controller
            name="price.amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid.toString()}>
                <FieldLabel className="text-sm font-semibold text-[#09090B] mb-2 block">
                  Valor por persona
                </FieldLabel>

                <div className="flex items-center gap-2 rounded-lg border border-[#E4E4E7] bg-white px-3 h-12 focus-within:border-[#E63946] focus-within:ring-1 focus-within:ring-[#E63946]/20 transition-colors">
                  <span className="text-sm font-semibold text-[#71717A] shrink-0">COP $</span>
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    className="flex-1 bg-transparent text-sm font-semibold text-[#09090B] placeholder:text-[#A1A1AA] outline-none tabular-nums"
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
                <input type="hidden" name="price.currency" value="COP" />

                <div className="flex flex-wrap gap-2 mt-2.5">
                  {PRICE_PRESETS.map((preset) => {
                    const formatted = formatWithDots(preset);
                    const isActive = parseDots(displayAmount) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setDisplayAmount(formatted);
                          field.onChange(preset);
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          isActive
                            ? "border-[#E63946] bg-[#FDF2F4] text-[#E63946]"
                            : "border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#A1A1AA]",
                        )}
                      >
                        ${formatWithDots(preset)}
                      </button>
                    );
                  })}
                </div>

                {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
              </Field>
            )}
          />

          {/* Nota informativa: pagado + externo (combinación válida) */}
          {isExternal && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#E4E4E7] bg-[#FAFAFC] px-4 py-3">
              <ExternalLink className="size-4 shrink-0 mt-0.5 text-[#71717A]" />
              <p className="text-xs text-[#71717A] leading-relaxed">
                Como elegiste registro externo, tú gestionas por tu cuenta el registro y el cobro de los asistentes. QueHayPaHacer solo mostrará el precio y llevará a las personas al sitio que indiques.
              </p>
            </div>
          )}

          {/* Alerta: pagado + no externo (combinación inválida para publicar) */}
          {!isExternal && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-[#FFF8E7] px-4 py-3">
              <Info className="size-4 shrink-0 mt-0.5 text-[#E09F00]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#92400E]">Se requiere registro externo para publicar</p>
                <p className="mt-0.5 text-xs text-[#92400E] leading-relaxed">
                  Los eventos pagados deben usar registro externo. Ve al paso de registro para configurarlo.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}


