import { Country, State } from "country-state-city";
import slugify from "slugify";
import type { LocationDetail, CityDetail } from "@/domain/shared/LocationDetail";

export function toGeoSlug(value: string): string {
  return slugify(value, { lower: true, strict: true });
}

/**
 * Resuelve el isoCode de país + departamento por nombre vía `country-state-city`.
 * Devuelve "" si no matchea. Para Ibagué: Colombia → "CO", Tolima → "TOL".
 */
export function resolveGeoIso(
  countryName: string,
  departmentName: string,
): { countryIso: string; departmentIso: string } {
  const country = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === countryName.trim().toLowerCase(),
  );
  const countryIso = country?.isoCode ?? "";
  const department = countryIso
    ? State.getStatesOfCountry(countryIso).find(
        (s) => s.name.toLowerCase() === departmentName.trim().toLowerCase(),
      )
    : undefined;
  return { countryIso, departmentIso: department?.isoCode ?? "" };
}

/**
 * Ensambla los objetos geográficos anidados de una location (país/departamento
 * con isoCode+name+slug, ciudad con name+slug). Fuente única para las actions de
 * sitios y los scripts de migración.
 */
export function buildLocationDetails(input: {
  countryName: string;
  countrySlug?: string;
  departmentName: string;
  departmentSlug?: string;
  cityName: string;
  citySlug?: string;
}): { country: LocationDetail; department: LocationDetail; city: CityDetail } {
  const { countryIso, departmentIso } = resolveGeoIso(input.countryName, input.departmentName);
  return {
    country: {
      isoCode: countryIso,
      name: input.countryName,
      slug: input.countrySlug || toGeoSlug(input.countryName),
    },
    department: {
      isoCode: departmentIso,
      name: input.departmentName,
      slug: input.departmentSlug || toGeoSlug(input.departmentName),
    },
    city: {
      name: input.cityName,
      slug: input.citySlug || toGeoSlug(input.cityName),
    },
  };
}
