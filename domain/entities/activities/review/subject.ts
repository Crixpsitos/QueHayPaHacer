/**
 * Una reseña es de una actividad (su id) o de un sitio (`site_<siteId>`). Así el sitio reutiliza todo el sistema de reseñas
 * (una por persona, fotos, cuestionar, responder, apelar). Las reseñas de actividades también cuentan para el sitio vinculado.
 */
export const SITE_SUBJECT_PREFIX = "site_"
export const siteSubject = (siteId: string) => `${SITE_SUBJECT_PREFIX}${siteId}`
export const isSiteSubject = (id: string) => id.startsWith(SITE_SUBJECT_PREFIX) && id.length > SITE_SUBJECT_PREFIX.length
export const siteIdOfSubject = (id: string) => id.slice(SITE_SUBJECT_PREFIX.length)
