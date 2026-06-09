"use client";

import { useEffect, useState, useTransition } from "react";
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
import { useLocationInfo } from "@/app/store/Location/IpLocationContext";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { SelectCurrency } from "@/presentation/events/components/ui/SelectCurrency";

interface Step7PricingProps {
  form: UseFormReturn<FormEventDto>;
}

interface CurrencyOption {
  currencyCode: string;
  symbol: string;
  countryName: string;
  countryIsoCode: string;
}

const loadCurrenciesValues = async (): Promise<CurrencyOption[]> => {
  const { getAllISOCodes } = await import("iso-country-currency");
  const allIsoData = getAllISOCodes();

  const uniqueMap = new Map<string, CurrencyOption>();

  allIsoData.forEach((item) => {
    if (!item.currency || !item.iso) return;

    if (uniqueMap.has(item.currency)) {
      const existing = uniqueMap.get(item.currency);
      if (existing && item.countryName && !existing.countryName.includes(item.countryName)) {
        existing.countryName = `${existing.countryName}, ${item.countryName}`;
      }
    } else {
      uniqueMap.set(item.currency, {
        currencyCode: item.currency,
        symbol: item.symbol || "$",
        countryName: item.countryName || "",
        countryIsoCode: item.iso,
      });
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) =>
    a.currencyCode.localeCompare(b.currencyCode)
  );
};

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
  const { location } = useLocationInfo();
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [, startTransition] = useTransition();
  const [displayAmount, setDisplayAmount] = useState<string>(() => {
    const initial = form.getValues("price.amount");
    return initial ? formatWithDots(initial) : "";
  });

  useEffect(() => {
    loadCurrenciesValues().then((data) => {
      startTransition(() => {
        setCurrencies(data);
      });
    });
  }, []);

  useEffect(() => {
    if (!location?.country || currencies.length === 0) return;

    const userCountryCode = location.country.isoCode;
    const initialCurrency = currencies.find((c) => c.countryIsoCode === userCountryCode)?.currencyCode || "COP";

    form.setValue("price.currency", initialCurrency);
  }, [location?.country, currencies, form]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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

            {/* Campo de Moneda Virtualizado (Simetría de UI Perfecta) */}
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
                  <SelectCurrency<CurrencyOption>
                    options={currencies}
                    value={field.value || ""}
                    invalid={fieldState.invalid}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    getValue={(option) => option.currencyCode}
                    getLabel={(option) => 
                      option.currencyCode === "COP"
                        ? "COP (CO$)"
                        : `${option.currencyCode} (${option.symbol}) - PRÓXIMAMENTE`
                    }
                    getDisabled={(option) => option.currencyCode !== "COP"}
                  />
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