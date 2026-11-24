/** Una función de un evento de varias fechas, ya reducida a datos simples (se cachea y viaja al navegador). */
export interface SessionIn { id: string; slug?: string; status: string; startDate: Date; endDate: Date; venue: string; address: string; price: string; free: boolean; tiers: string }
export interface EventSlot { sessionId: string; /** Ruta de la función: su slug o, si no tiene, su id. */ ref: string; startsAt: number; endsAt: number; venue: string; place: string; price: string; free: boolean; tiers: string; /** «Función 2 de 4». */ label: string; total: number }

/**
 * Funciones por venir de un evento de varias fechas, en orden. `label` cuenta sobre todas las funciones publicadas
 * (también las pasadas), para que «Función 2 de 4» no cambie cuando pasa la primera. Sin funciones publicadas devuelve [].
 */
export function eventSlots(sessions: SessionIn[], now: number): EventSlot[] {
  const active = sessions.filter((s) => s.status === "published").sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  return active.flatMap((s, i): EventSlot[] => s.endDate.getTime() < now ? [] : [{
    sessionId: s.id, ref: s.slug || s.id, startsAt: s.startDate.getTime(), endsAt: s.endDate.getTime(),
    venue: s.venue, place: [s.venue, s.address].filter(Boolean).join(" · "), price: s.price, free: s.free, tiers: s.tiers,
    label: `Función ${i + 1} de ${active.length}`, total: active.length,
  }])
}
