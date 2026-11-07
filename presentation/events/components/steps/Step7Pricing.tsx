"use client";

import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { Gift, Ticket, Info, ExternalLink, Plus, Trash2 } from "lucide-react";
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
const MAX_TIERS = 6;

type Tier = { name: string; amount: number };

export function Step7Pricing({ form }: Step7PricingProps) {
  const isFree = form.watch("price.isFree");
  const registrationType = form.watch("registrationType");
  const isExternal = registrationType === "external";

  const tiers: Tier[] = form.watch("price.tiers") ?? [];
  const tierMode = tiers.length > 1;
  const tiersError = form.formState.errors.price?.tiers;

  // `price.amount` guarda siempre la categoría más barata: filtros, tarjetas y SEO lo leen.
  const setTiers = (next: Tier[]) => {
    form.setValue("price.tiers", next.length > 1 ? next : [], { shouldValidate: true, shouldDirty: true });
    const positives = next.map((t) => t.amount).filter((a) => a > 0);
    form.setValue("price.amount", positives.length ? Math.min(...positives) : 0, { shouldValidate: true, shouldDirty: true });
  };
  const patchTier = (i: number, patch: Partial<Tier>) =>
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const [displayAmount, setDisplayAmount] = useState<string>(() => {
    const initial = form.getValues("price.amount");
    return initial ? formatWithDots(initial) : "";
  });
  // Controla si mostramos el modal de advertencia (solo cuando pagado + no externo)
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const startTiers = () =>
    setTiers([
      { name: "Entrada estándar", amount: parseDots(displayAmount) },
      { name: "Entrada premium", amount: 0 },
    ]);
  const removeTier = (i: number) => {
    const next = tiers.filter((_, idx) => idx !== i);
    if (next.length === 1) setDisplayAmount(next[0].amount ? formatWithDots(next[0].amount) : "");
    setTiers(next);
  };

  const handleSelectFree = () => {
    form.setValue("price.isFree", true, { shouldValidate: true });
    form.setValue("price.amount", 0, { shouldValidate: true });
    form.setValue("price.tiers", [], { shouldDirty: true });
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
                className="w-full rounded-xl bg-[#D42F3C] hover:bg-[#9B0A26] px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-primary-glow"
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
                ? "border-[#D42F3C] bg-[#FDF2F4]"
                : "border-[#E4E4E7] bg-white hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
            )}
          >
            <span className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              isFree ? "bg-[#D42F3C] text-white" : "bg-[#F4F4F5] text-[#71717A]",
            )}>
              <Gift className="size-5" />
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", isFree ? "text-[#D42F3C]" : "text-[#09090B]")}>Gratis</p>
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
                ? "border-[#D42F3C] bg-[#FDF2F4]"
                : "border-[#E4E4E7] bg-white hover:bg-[#FAFAFC] hover:border-[#A1A1AA]",
            )}
          >
            <span className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              !isFree ? "bg-[#D42F3C] text-white" : "bg-[#F4F4F5] text-[#71717A]",
            )}>
              <Ticket className="size-5" />
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", !isFree ? "text-[#D42F3C]" : "text-[#09090B]")}>Pagado</p>
              <p className="text-xs text-[#71717A] mt-0.5">Indica el valor por persona</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Card: valor (solo cuando pagado) ── */}
      {!isFree && (
        <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card space-y-5">

          {tierMode ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#09090B]">Categorías de entrada</p>
              {tiers.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    aria-label={`Nombre de la categoría ${i + 1}`}
                    maxLength={40}
                    placeholder="Ej. Entrada premium"
                    value={t.name}
                    onChange={(e) => patchTier(i, { name: e.target.value })}
                    className="h-12 min-w-0 flex-1 rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm font-medium text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#D42F3C] focus:ring-1 focus:ring-[#D42F3C]/20"
                  />
                  <div className="flex h-12 w-40 shrink-0 items-center gap-2 rounded-lg border border-[#E4E4E7] bg-white px-3 focus-within:border-[#D42F3C] focus-within:ring-1 focus-within:ring-[#D42F3C]/20">
                    <span className="shrink-0 text-sm font-semibold text-[#71717A]">$</span>
                    <input
                      aria-label={`Valor de la categoría ${i + 1}`}
                      inputMode="numeric"
                      placeholder="0"
                      value={t.amount ? formatWithDots(t.amount) : ""}
                      onChange={(e) => patchTier(i, { amount: parseDots(e.target.value) })}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold tabular-nums text-[#09090B] outline-none placeholder:text-[#A1A1AA]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    aria-label={`Quitar categoría ${t.name || i + 1}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#D42F3C]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <input type="hidden" name="price.currency" value="COP" />
              {tiersError && (
                <p role="alert" className="text-xs text-[#D42F3C]">
                  Cada categoría necesita un nombre y un valor mayor a 0.
                </p>
              )}
            </div>
          ) : (
          <Controller
            name="price.amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid.toString()}>
                <FieldLabel className="text-sm font-semibold text-[#09090B] mb-2 block">
                  Valor por persona
                </FieldLabel>

                <div className="flex items-center gap-2 rounded-lg border border-[#E4E4E7] bg-white px-3 h-12 focus-within:border-[#D42F3C] focus-within:ring-1 focus-within:ring-[#D42F3C]/20 transition-colors">
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
                            ? "border-[#D42F3C] bg-[#FDF2F4] text-[#D42F3C]"
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
          )}

          {tiers.length < MAX_TIERS && (
            <button
              type="button"
              onClick={tierMode ? () => setTiers([...tiers, { name: "", amount: 0 }]) : startTiers}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D42F3C] hover:underline"
            >
              <Plus className="size-4" />
              {tierMode ? "Agregar otra categoría" : "Tengo varias categorías de entrada (estándar, premium…)"}
            </button>
          )}

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


