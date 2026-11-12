/** Mínimo de actividades públicas para que una landing valga una página propia en Google. */
export const MIN_COLLECTION_ITEMS = 3
/** Mínimo de texto introductorio propio (caracteres): sin él la página es solo una lista repetida del hub. */
export const MIN_COLLECTION_INTRO_CHARS = 160

/**
 * Regla de fundamento (spec B4): una landing se indexa solo con intención de búsqueda propia (la define quien escribe la
 * colección), texto introductorio propio y al menos {@link MIN_COLLECTION_ITEMS} actividades públicas. Si falla algo:
 * `noindex` y fuera del sitemap (la página sigue existiendo para quien llega por enlace).
 */
export function isIndexableCollection(introText: string, publicCount: number): boolean {
  return introText.trim().length >= MIN_COLLECTION_INTRO_CHARS && publicCount >= MIN_COLLECTION_ITEMS
}
