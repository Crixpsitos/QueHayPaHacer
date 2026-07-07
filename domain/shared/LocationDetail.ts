/**
 * Detalle geográfico con código ISO — país y departamento.
 * Forma compartida entre `Event.Location` y `Site.SiteLocation`.
 */
export interface LocationDetail {
  isoCode: string;
  name: string;
  slug: string;
}

/**
 * Ciudad: SIN código ISO (las ciudades no tienen ISO estándar en
 * `country-state-city`). Solo nombre + slug.
 */
export interface CityDetail {
  name: string;
  slug: string;
}
