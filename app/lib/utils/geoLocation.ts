import slugify from "slugify";
import type { LocationDetail, CityDetail } from "@/domain/shared/LocationDetail";

export function toGeoSlug(value: string): string {
  return slugify(value, { lower: true, strict: true });
}

// ponytail: MVP fijo a Ibagué/Tolima. Se quitó `country-state-city`; cuando se
// reactive multi-ciudad, resolver isoCodes vía fetch API. Mapa mínimo por nombre.
const COUNTRY_ISO: Record<string, string> = { colombia: "CO" };
const DEPARTMENT_ISO: Record<string, string> = { tolima: "TOL" };

/**
 * Resuelve el isoCode de país + departamento por nombre.
 * Devuelve "" si no matchea. Para Ibagué: Colombia → "CO", Tolima → "TOL".
 */
export function resolveGeoIso(
  countryName: string,
  departmentName: string,
): { countryIso: string; departmentIso: string } {
  return {
    countryIso: COUNTRY_ISO[countryName.trim().toLowerCase()] ?? "",
    departmentIso: DEPARTMENT_ISO[departmentName.trim().toLowerCase()] ?? "",
  };
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
