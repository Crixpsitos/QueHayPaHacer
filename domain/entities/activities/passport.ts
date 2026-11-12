/** Pasaporte de Ibagué: cada QR del local da UN sello por actividad (visita verificada). Sin recompensas con dinero. */
export const PASSPORT_BADGE_ID = "pasaporte-ibague"
export const STAMPS_FOR_BADGE = 3
/** Tope diario de sellos por persona: nadie junta sellos recorriendo la ciudad en una hora. */
export const MAX_STAMPS_PER_DAY = 5

export function canStamp(c: { alreadyStamped: boolean; stampsToday: number }): string | null {
  if (c.alreadyStamped) return "Ya tienes el sello de esta actividad."
  if (c.stampsToday >= MAX_STAMPS_PER_DAY) return "Hoy ya juntaste el máximo de sellos. Vuelve mañana."
  return null
}

export const passportBadgesFor = (stamps: number): string[] => (stamps >= STAMPS_FOR_BADGE ? [PASSPORT_BADGE_ID] : [])
