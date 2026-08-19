/**
 * URL base del sitio para canonical, OpenGraph y sitemap. En producción se fija
 * con NEXT_PUBLIC_SITE_URL; en dev cae a localhost.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const SITE_NAME = "Que Hay Pa Hacer?";
