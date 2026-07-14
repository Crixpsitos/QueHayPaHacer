"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldGroup,
} from "@/app/components/ui/field";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { Controller, UseFormReturn, useWatch } from "react-hook-form";
import { MapPin } from "lucide-react";
import { useEffect } from "react";
import { Input } from "@/app/components/ui/input";
import dynamic from "next/dynamic";
import { SearchLocationInput } from "../ui/SearchLocationInput";

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

  // Fija Ibagué/Tolima/Colombia en los campos ocultos si aún están vacíos.
  useEffect(() => {
    if (!form.getValues("location.country")?.isoCode) {
      form.setValue("location.country", IBAGUE_COUNTRY);
      form.setValue("location.department", IBAGUE_DEPARTMENT);
      form.setValue("location.city", IBAGUE_CITY);
    }
  }, [form]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">Ubicación</h2>
        <p className="text-sm text-gray-500">
          ¿Dónde se llevará a cabo tu evento?
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
        <span>
          <span className="font-medium text-black">Ibagué</span>, Tolima —
          Colombia
        </span>
      </div>

      <FieldGroup>
        <Controller
          name="location.venue"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <FieldLabel>
                Espacio especifico donde se hara el evento
              </FieldLabel>
              <FieldDescription>
                Especifica el nombre del espacio donde se llevará a cabo el
                evento, como un parque, un bar, un teatro, etc.
              </FieldDescription>
              <SearchLocationInput
                {...field}
                cityCoords={IBAGUE_CITY_COORDS}
                value={field.value ?? ""}
                disabled={field.disabled}
                cityName={IBAGUE_CITY.name}
                countryIsoCode={IBAGUE_COUNTRY.isoCode}
                onChange={(value, coords, address) => {
                  field.onChange(value);

                  form.setValue("location.address", address, {
                    shouldValidate: true,
                  });
                  form.setValue(
                    "location.coordinates",
                    {
                      lat: coords[1],
                      lng: coords[0],
                    },
                    { shouldValidate: true },
                  );
                }}
              />
              {fieldState.invalid && (
                <FieldError>{fieldState.error?.message}</FieldError>
              )}
            </Field>
          )}
        />
        <Controller
          name="location.address"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <FieldLabel>Dirección</FieldLabel>
              <FieldDescription>
                Especifica la dirección exacta donde se llevará a cabo el
                evento.
              </FieldDescription>
              <Input
                className="bg-transparent border border-gray-200"
                {...field}
                value={field.value ?? ""}
              />
              {fieldState.invalid && (
                <FieldError>{fieldState.error?.message}</FieldError>
              )}
            </Field>
          )}
        />
        <Controller
          name="location.moreInfo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <FieldLabel>Más información (Opcional)</FieldLabel>
              <FieldDescription>
                Especifica más información sobre el lugar donde se llevará a cabo
                el evento.
              </FieldDescription>
              <Input
                className="bg-transparent border border-gray-200"
                {...field}
                value={field.value ?? ""}
              />
              {fieldState.invalid && (
                <FieldError>{fieldState.error?.message}</FieldError>
              )}
            </Field>
          )}
        />
        <Controller
          name="location.coordinates"
          control={form.control}
          render={({ fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <FieldLabel>Ubicación en el mapa</FieldLabel>
              <FieldDescription>
                Arrastra el marcador para ajustar la ubicación exacta.
              </FieldDescription>
              <MapZone
                cityCoords={IBAGUE_CITY_COORDS}
                pointCoords={watchedCoordinates}
                onMarkerDrag={(lat, lng) => {
                  form.setValue("location.coordinates", {
                    lat,
                    lng,
                  });
                }}
              />
            </Field>
          )}
        />
      </FieldGroup>
    </div>
  );
};
