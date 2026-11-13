import type { SiteCatalog } from "./SiteCatalog"

export interface CatalogStats { products: number; sections: number; withoutPhoto: number; promotions: number; percent: number; tip: string | null }

/** Resumen de la carta para el panel: cuántos productos, cuántas secciones y qué tan completa está (WhatsApp, fotos, descripciones). */
export function catalogStats(c: SiteCatalog, liveCount: number): CatalogStats {
  const n = c.products.length
  const withoutPhoto = c.products.filter((p) => !p.photoUrl).length
  const withoutDesc = c.products.filter((p) => !p.description.trim()).length
  const parts = [c.whatsapp ? 1 : 0, n ? (n - withoutPhoto) / n : 0, n ? (n - withoutDesc) / n : 0]
  const percent = n === 0 ? 0 : Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
  const tip = !c.whatsapp ? "Falta tu WhatsApp para que te pregunten" : withoutPhoto ? `Faltan fotos en ${withoutPhoto} ${withoutPhoto === 1 ? "producto" : "productos"}` : withoutDesc ? `Faltan descripciones en ${withoutDesc}` : null
  return { products: n, sections: new Set(c.products.map((p) => p.section).filter(Boolean)).size, withoutPhoto, promotions: liveCount, percent, tip }
}
