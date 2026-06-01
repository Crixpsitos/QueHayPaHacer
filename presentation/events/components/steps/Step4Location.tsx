"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/app/components/ui/field";
import { useLocationInfo } from "@/app/store/Location/IpLocationContext";
import { FormEventDto } from "@/application/dto/events/EventDto";
import { Controller, UseFormReturn, useWatch } from "react-hook-form";
import { SelectLocation } from "../ui/SelectLocation";
import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";
import { useEffect, useMemo, useRef } from "react";
import { Input } from "@/app/components/ui/input";
import dynamic from "next/dynamic";
import { SearchLocationInput } from "../ui/SearchLocationInput";

interface Step4Props {
  form: UseFormReturn<FormEventDto>;
}

const MapZone = dynamic(
  () => import("../mapzone/MapZone").then((mod) => mod.MapZone),
  { ssr: false },
);

export const Step4Location = ({ form }: Step4Props) => {
  const { location } = useLocationInfo();
  const hasInitializedGeoIp = useRef(false); // para evitar que se dispare el useEffect cuando ya se asigno todos los geo campos al formulario

  const watchedCountry = useWatch({
    control: form.control,
    name: "location.country",
  });

  const watchedDepartment = useWatch({
    control: form.control,
    name: "location.department",
  });

  const watchedCity = useWatch({
    control: form.control,
    name: "location.city",
  });

  const watchedCoordinates = useWatch({
    control: form.control,
    name: "location.coordinates",
  });

  const countriesList = useMemo(() => {
    return Country.getAllCountries().map((country) => ({
      ...country,
      disabled: country.isoCode !== "CO",
    }));
  }, []);

  const departmentsList: IState[] = useMemo(() => {
    if (watchedCountry) {
      return State.getStatesOfCountry(watchedCountry.isoCode);
    }
    return [];
  }, [watchedCountry]);

  const citiesList: ICity[] = useMemo(() => {
    if (watchedDepartment) {
      return City.getCitiesOfState(
        watchedCountry?.isoCode ?? "",
        watchedDepartment?.isoCode ?? "",
      );
    }
    return [];
  }, [watchedCountry, watchedDepartment]);

  const currentCity = useMemo(() => {
    if (watchedCity) {
      return citiesList.find(
        (c) => c.name.toLowerCase() === watchedCity.toLowerCase(),
      );
    }
    return null;
  }, [citiesList, watchedCity]);

  const currentCityCoords = useMemo(() => {
    if (currentCity) {
      const latitude = currentCity.latitude
        ? parseFloat(currentCity.latitude)
        : 0;
      const longitude = currentCity.longitude
        ? parseFloat(currentCity.longitude)
        : 0;

      return {
        latitude,
        longitude,
      };
    }
    return null;
  }, [currentCity]);

  useEffect(() => {
    if (!location || hasInitializedGeoIp.current) return;

    if (!watchedCountry && location?.country) {
      const matchedCountry = countriesList.find(
        (c) =>
          c.isoCode === location.country.isoCode ||
          c.name.toLowerCase() === location.country.name?.toLowerCase(),
      );
      if (matchedCountry) {
        form.setValue("location.country", {
          isoCode: matchedCountry.isoCode,
          name: matchedCountry.name,
        });
      }
      return;
    }

    if (watchedCountry && !watchedDepartment && departmentsList.length > 0) {
      const matchedDepartment = departmentsList.find(
        (d) =>
          d.isoCode === location?.state?.isoCode ||
          d.name.toLowerCase() === location?.state?.name?.toLowerCase(),
      );
      if (matchedDepartment) {
        form.setValue("location.department", {
          isoCode: matchedDepartment.isoCode,
          name: matchedDepartment.name,
        });
      }
      return;
    }

    if (watchedCountry && watchedDepartment && citiesList.length > 0) {
      const matchedCity = citiesList.find(
        (c) => c.name.toLowerCase() === location?.city?.toLowerCase(),
      );

      if (matchedCity) {
        form.setValue("location.city", matchedCity.name);
        hasInitializedGeoIp.current = true;
      }
    }
  }, [
    watchedCountry,
    watchedDepartment,
    citiesList,
    location,
    departmentsList,
    countriesList,
    form,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-black">Ubicación</h2>
        <p className="text-sm text-gray-500">
          ¿Dónde se llevará a cabo tu evento? ¿En una ciudad o en un lugar más
          remoto?
        </p>
      </div>
      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="location.country"
            control={form.control}
            render={({ field, fieldState }) => (
              <SelectLocation<ICountry>
                label="País"
                description="¿En qué país se llevará a cabo el evento?"
                options={countriesList}
                getValue={(option) => option.isoCode}
                getLabel={(option) =>
                  option.isoCode === "CO"
                    ? option.name
                    : `${option.name} — Próximamente`
                }
                getDisabled={(option) => option.isoCode !== "CO"}
                value={field.value?.isoCode ?? ""}
                invalid={fieldState.invalid}
                error={fieldState.error?.message}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(selectedIsoCode) => {
                  const fullCountry = countriesList.find(
                    (c) => c.isoCode === selectedIsoCode,
                  );

                  if (fullCountry) {
                    field.onChange({
                      isoCode: fullCountry.isoCode,
                      name: fullCountry.name,
                    });
                  } else {
                    field.onChange({ isoCode: "", name: "" });
                  }

                  form.setValue("location.department", {
                    isoCode: "",
                    name: "",
                  });
                  form.setValue("location.city", "");
                  form.setValue("location.venue", "");
                  form.setValue("location.address", "");
                  form.setValue("location.coordinates", {
                    lat: 0,
                    lng: 0,
                  });
                }}
                disabled={field.disabled}
              />
            )}
          />
          <Controller
            name="location.department"
            control={form.control}
            render={({ field, fieldState }) => (
              <SelectLocation<IState>
                label="Departamento"
                description="¿En qué departamento se llevará a cabo el evento?"
                options={departmentsList}
                getValue={(option) => option.isoCode}
                getLabel={(option) => option.name}
                value={field.value?.isoCode ?? ""}
                invalid={fieldState.invalid}
                onChange={(selectedIsoCode) => {
                  const fullDepartment = departmentsList.find(
                    (d) => d.isoCode === selectedIsoCode,
                  );

                  if (fullDepartment) {
                    field.onChange({
                      isoCode: fullDepartment.isoCode,
                      name: fullDepartment.name,
                    });
                  } else {
                    field.onChange({ isoCode: "", name: "" });
                  }

                  form.setValue("location.city", "");
                  form.setValue("location.venue", "");
                  form.setValue("location.address", "");
                  form.setValue("location.coordinates", {
                    lat: 0,
                    lng: 0,
                  });
                }}
                disabled={departmentsList.length === 0 || field.disabled}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                ref={field.ref}
              />
            )}
          />
          <Controller
            name="location.city"
            control={form.control}
            render={({ field, fieldState }) => (
              <SelectLocation<ICity>
                label="Ciudad"
                description="¿En qué ciudad se llevará a cabo el evento?"
                options={citiesList}
                getValue={(option) => option.name}
                getLabel={(option) => option.name}
                value={field.value ?? ""}
                invalid={fieldState.invalid}
                onChange={field.onChange}
                disabled={citiesList.length === 0 || field.disabled}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                ref={field.ref}
              />
            )}
          />
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
                  cityCoords={currentCityCoords}
                  value={field.value}
                  disabled={!currentCity || field.disabled}
                  cityName={currentCity?.name}
                  countryIsoCode={
                    typeof currentCity?.countryCode === "string"
                      ? currentCity.countryCode
                      : ""
                  }
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
                <Input className="bg-transparent border border-gray-200" {...field} />
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
                  Especifica más información sobre el lugar donde se llevará a
                  cabo el evento.
                </FieldDescription>
                <Input className="bg-transparent border border-gray-200" {...field} />
                {fieldState.invalid && (
                  <FieldError>{fieldState.error?.message}</FieldError>
                )}
              </Field>
            )}
          />
        </div>
        <Controller
          name="location.coordinates"
          control={form.control}
          render={({ fieldState }) => (
            <Field data-invalid={fieldState.invalid.toString()}>
              <FieldLabel>Ubicación</FieldLabel>
              <FieldDescription>
                ¿Dónde se llevará a cabo el evento? ¿En una ciudad o en un lugar
                más remoto?
              </FieldDescription>
              <MapZone
                cityCoords={currentCityCoords}
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
