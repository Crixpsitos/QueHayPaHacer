/** Por debajo de esto (y sin secciones) la descripción deja la página corta. */
export const SPARSE_DESCRIPTION_CHARS = 280

/**
 * ¿A la ficha le falta contenido? Sin fotos, o con descripción corta y sin secciones desplegables.
 * Solo entonces se muestran los bloques de relleno de la plataforma («Cómo funciona») y la portada compacta.
 */
export function isSparse(v: { gallery: unknown[]; description: string; sections: unknown[] }): boolean {
  if (v.gallery.length === 0) return true
  return v.sections.length === 0 && v.description.trim().length < SPARSE_DESCRIPTION_CHARS
}
