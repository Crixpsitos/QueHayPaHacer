/**
 * URL base del sitio para canonical, OpenGraph y sitemap. En producción se fija
 * con NEXT_PUBLIC_SITE_URL; en dev cae a localhost.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const SITE_NAME = "Que Hay Pa Hacer?";

/** Vista previa por defecto (inicio, listados y todo lo que no tenga portada propia). Ver app/og/. */
export const DEFAULT_OG_IMAGE = { url: "/og/default", width: 1200, height: 630, alt: SITE_NAME };
