export const SEARCH_QUERY_MAX = 80

/** Consulta de búsqueda segura para el índice de texto: recorta, colapsa espacios, quita caracteres de control y limita el largo. */
export function normalizeSearchQuery(q: unknown): string {
  if (typeof q !== "string") return ""
  // eslint-disable-next-line no-control-regex
  return q.replace(/\s+/g, " ").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, SEARCH_QUERY_MAX).trim()
}
