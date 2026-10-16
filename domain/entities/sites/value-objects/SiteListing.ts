/**
 * Tipo de sitio y nivel de confianza de su información.
 *
 * - kind: "public" = atractivo sin negocio detrás (mirador, cascada de acceso libre, parque);
 *   "business" = negocio privado (restaurante, finca, glamping, aunque sea turístico).
 * - publishedAs: en qué calidad publicó quien lo subió. "qhpa" solo lo fija el servidor
 *   (cuentas en QHPA_ADMIN_UIDS); el cliente nunca lo elige.
 * - verification: "community" = nadie con vínculo con el lugar respalda la ficha;
 *   "claimed" = lo publicó alguien que declara ser dueño/representante, sin revisión de QHPA;
 *   "verified" = QHPA revisó la evidencia de un reclamo. Solo se llega aquí por el script de
 *   reclamos; nunca desde un formulario.
 */
export const SITE_KINDS = ["public", "business"] as const;
export type SiteKind = (typeof SITE_KINDS)[number];

export const SITE_PUBLISHED_AS = ["owner", "proposer", "qhpa"] as const;
export type SitePublishedAs = (typeof SITE_PUBLISHED_AS)[number];

export const SITE_VERIFICATIONS = ["community", "claimed", "verified"] as const;
export type SiteVerification = (typeof SITE_VERIFICATIONS)[number];

/** Lo que el formulario puede elegir (qhpa lo decide el servidor). */
export const SITE_PUBLISHED_AS_FORM = ["owner", "proposer"] as const;
export type SitePublishedAsForm = (typeof SITE_PUBLISHED_AS_FORM)[number];

/** Verificación inicial al publicar. "verified" nunca sale de aquí. */
export function initialVerification(publishedAs: SitePublishedAs): SiteVerification {
  return publishedAs === "owner" ? "claimed" : "community";
}
