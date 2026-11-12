import { generateCheckInCode } from "@/domain/entities/EventRegistration/checkIn"
import { cleanGuest, entryCode, GUEST_MAX_PER_EVENT, GUEST_PREFIX, type GuestInput } from "@/domain/entities/EventRegistration/guest"
import type { IEventGuestRepository } from "@/domain/repository/EventRegistration/IEventGuestRepository"

export interface GuestDeps { repo: IEventGuestRepository; randomBytes: (n: number) => Uint8Array }

/** Invitados sin cuenta que agrega quien organiza: entrada con código QR (el check-in de siempre los marca). */
export class EventGuestService {
  constructor(private readonly d: GuestDeps) {}

  async add(eventId: string, addedBy: string, input: GuestInput): Promise<{ ok: true; code: string; name: string; phone: string | null } | { ok: false; error: string }> {
    const g = cleanGuest(input)
    if (!g.ok) return g
    if ((await this.d.repo.count(eventId)) >= GUEST_MAX_PER_EVENT) return { ok: false, error: `Llegaste al máximo de ${GUEST_MAX_PER_EVENT} personas agregadas a mano en este evento.` }
    const code = generateCheckInCode(this.d.randomBytes)
    const id = `${GUEST_PREFIX}${Array.from(this.d.randomBytes(8), (b) => (b & 15).toString(16)).join("")}`
    await this.d.repo.add(eventId, { id, name: g.name, phone: g.phone, code, addedBy })
    return { ok: true, code, name: g.name, phone: g.phone }
  }

  /** Para la página pública de la entrada: solo el nombre. null si el código no existe o la inscripción se canceló. */
  async ticket(eventId: string, rawCode: string): Promise<{ name: string; code: string } | null> {
    const code = entryCode(rawCode)
    if (!code) return null
    const g = await this.d.repo.findByCode(eventId, code)
    return g ? { name: g.name, code } : null
  }
}
