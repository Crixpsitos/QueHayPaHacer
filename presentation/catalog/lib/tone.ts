/**
 * Color de relleno de un producto o promoción sin foto: sale de su sección, así cada sección tiene el suyo y la carta no se ve
 * como una pared del mismo color. Solo los colores de la marca (dorado, vinotinto, rojo); el texto encima va en `ink`.
 */
const TONES = [
  { bg: "linear-gradient(135deg,#FFB703,#F59E0B)", ink: "#5C0011" },
  { bg: "linear-gradient(135deg,#9B0A26,#6B0719)", ink: "#FFFFFF" },
  { bg: "linear-gradient(135deg,#D42F3C,#9B0A26)", ink: "#FFFFFF" },
  { bg: "linear-gradient(135deg,#F5E3B0,#E9C46A)", ink: "#5C0011" },
  { bg: "linear-gradient(135deg,#FFB703,#D42F3C)", ink: "#FFFFFF" },
] as const

export function sectionTone(section: string): { bg: string; ink: string } {
  let h = 0
  for (const c of section) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TONES[h % TONES.length]
}
