"use client";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { Controller, UseFormReturn, useWatch } from "react-hook-form";
import { MapPin } from "lucide-react";
import { useEffect } from "react";
import { Input } from "@/app/components/ui/input";
import dynamic from "next/dynamic";
import { SearchLocationInput } from "../ui/SearchLocationInput";
import { SitePickerWidget } from "../ui/SitePickerWidget";

interface Step4Props {
  form: UseFormReturn<FormEventDto>;
}

// ponytail: MVP dedicado a Ibagué/Tolima. País/departamento/ciudad fijos y
// ocultos. Al reactivar multi-ciudad, volver a un SelectLocation alimentado por
// fetch API (por eso se quitó la librería country-state-city).
const IBAGUE_COUNTRY = { isoCode: "CO", name: "Colombia", slug: "colombia" };
const IBAGUE_DEPARTMENT = { isoCode: "TOL", name: "Tolima", slug: "tolima" };
const IBAGUE_CITY = { name: "Ibagué", slug: "ibague" };
const IBAGUE_CITY_COORDS = { latitude: 4.4389, longitude: -75.2322 };

const MapZone = dynamic(
  () => import("../mapzone/MapZone").then((mod) => mod.MapZone),
  { ssr: false },
);

export const Step4Location = ({ form }: Step4Props) => {
  const watchedCoordinates = useWatch({
    control: form.control,
    name: "location.coordinates",
  });

  const watchedSiteId = useWatch({
    control: form.control,
    name: "location.siteId",
  });

  useEffect(() => {
    if (!form.getValues("location.country")?.isoCode) {
      form.setValue("location.country", IBAGUE_COUNTRY);
      form.setValue("location.department", IBAGUE_DEPARTMENT);
      form.setValue("location.city", IBAGUE_CITY);
    }
  }, [form]);

  const handleSiteSelect = (site: { siteId: string; venue: string; address: string; coordinates: { lat: number; lng: number } }) => {
    form.setValue("location.venue", site.venue, { shouldValidate: true });
    form.setValue("location.address", site.address, { shouldValidate: true });
    form.setValue("location.coordinates", site.coordinates, { shouldValidate: true });
    form.setValue("location.siteId", site.siteId);
    form.setValue("location.country", IBAGUE_COUNTRY);
    form.setValue("location.department", IBAGUE_DEPARTMENT);
    form.setValue("location.city", IBAGUE_CITY);
  };

  return (
    <div className="space-y-4">

      {/* ── Card principal: campos de ubicación ── */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card space-y-4">

        {/* Sitios creados del usuario */}
        <SitePickerWidget
          onSelect={handleSiteSelect}
          selectedSiteId={watchedSiteId}
        />

        {/* Ciudad fija — MVP Ibagué */}
        <div className="flex items-center gap-2 rounded-lg border border-[#E4E4E7] bg-[#FAFAFC] px-3 h-12 text-sm text-[#09090B]">
          <MapPin className="size-4 shrink-0 text-[#E63946]" />
          <span>
            <span className="font-semibold">Ibagué</span>
            <span className="text-[#71717A]">, Tolima — Colombia</span>
          </span>
        </div>

        <div className="border-t border-[#F4F4F5]" />

        {/* Espacio específico */}
        <Controller
          name="location.venue"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <div className="mb-1.5">
                <FieldLabel className="text-sm font-semibold text-[#09090B]">
                  Espacio específico
                </FieldLabel>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Nombre del lugar: parque, teatro, bar, etc.
                </p>
              </div>
              <SearchLocationInput
                {...field}
                cityCoords={IBAGUE_CITY_COORDS}
                value={field.value ?? ""}
                disabled={field.disabled}
                cityName={IBAGUE_CITY.name}
                countryIsoCode={IBAGUE_COUNTRY.isoCode}
                onChange={(value, coords, address) => {
                  field.onChange(value);
                  form.setValue("location.address", address, { shouldValidate: true });
                  form.setValue("location.coordinates", { lat: coords[1], lng: coords[0] }, { shouldValidate: true });
                }}
              />
              {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
            </Field>
          )}
        />

        {/* Dirección */}
        <Controller
          name="location.address"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <div className="mb-1.5">
                <FieldLabel className="text-sm font-semibold text-[#09090B]">Dirección</FieldLabel>
                <p className="text-xs text-[#71717A] mt-0.5">Dirección exacta del evento.</p>
              </div>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="Cra 3 #10-52"
                className="rounded-lg border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-[#A1A1AA] focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20 h-11"
              />
              {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
            </Field>
          )}
        />

        {/* Más información */}
        <Controller
          name="location.moreInfo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <div className="mb-1.5 flex items-center gap-2">
                <FieldLabel className="text-sm font-semibold text-[#09090B]">Más información</FieldLabel>
                <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#71717A]">Opcional</span>
              </div>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="Ej: Entrada por la puerta lateral, piso 2"
                className="rounded-lg border-[#E4E4E7] bg-white text-[#09090B] placeholder:text-[#A1A1AA] focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946]/20 h-11"
              />
              {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      {/* ── Card mapa ── */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        <div className="mb-3">
          <p className="text-sm font-semibold text-[#09090B]">Ubicación exacta en el mapa</p>
          <p className="text-xs text-[#71717A] mt-0.5">Arrastra el marcador para ajustar la ubicación exacta.</p>
        </div>
        <Controller
          name="location.coordinates"
          control={form.control}
          render={({ fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <div className="overflow-hidden rounded-xl border border-[#E4E4E7]">
                <MapZone
                  cityCoords={IBAGUE_CITY_COORDS}
                  pointCoords={watchedCoordinates}
                  onMarkerDrag={(lat, lng) => {
                    form.setValue("location.coordinates", { lat, lng });
                  }}
                />
              </div>
              {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
            </Field>
          )}
        />
      </div>

    </div>
  );
};
