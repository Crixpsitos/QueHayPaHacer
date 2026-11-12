import type { ActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory"

/**
 * Qué categorías de actividad pueden llevar carta (productos) y promociones. Una sola tabla: cambiar una regla es editar una
 * línea. Voluntariado, fe y «otros» no venden ni hacen promociones; aire libre y espacios muestran su catálogo pero sin descuentos
 * (alquiler de equipo con riesgo / espacios que se reservan, no se compran).
 */
export const CATALOG_RULES: Record<ActivityCategory, { catalog: boolean; promotions: boolean }> = {
  "aire-libre": { catalog: true, promotions: false },
  "comida-y-bebida": { catalog: true, promotions: true },
  "cultura-y-arte": { catalog: true, promotions: true },
  "deporte-y-bienestar": { catalog: true, promotions: true },
  "en-familia": { catalog: true, promotions: true },
  "musica-y-vida-nocturna": { catalog: true, promotions: true },
  "cine-y-espectaculos": { catalog: true, promotions: true },
  "lectura-y-clubes": { catalog: true, promotions: true },
  "talleres-y-aprendizaje": { catalog: true, promotions: true },
  "compras-y-mercados": { catalog: true, promotions: true },
  "espacios-y-reservas": { catalog: true, promotions: false },
  "juegos-y-diversion": { catalog: true, promotions: true },
  "turismo-y-paseos": { catalog: true, promotions: true },
  "voluntariado-y-comunidad": { catalog: false, promotions: false },
  "fe-y-espiritualidad": { catalog: false, promotions: false },
  otros: { catalog: false, promotions: false },
}

export const canShowCatalog = (c: ActivityCategory): boolean => CATALOG_RULES[c]?.catalog ?? false
export const canShowPromotions = (c: ActivityCategory): boolean => CATALOG_RULES[c]?.promotions ?? false

/** Por qué una actividad no admite promociones (para el selector). null = sí admite. */
export function promoBlockReason(c: ActivityCategory, categoryName: string): string | null {
  return canShowPromotions(c) ? null : `${categoryName}: no admite promociones`
}
