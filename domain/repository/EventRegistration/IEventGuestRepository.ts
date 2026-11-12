export interface GuestEntry { id: string; name: string; phone: string | null; code: string; addedBy: string; tier?: string | null }

/** Invitados sin cuenta: viven en `events/{id}/registrations/guest_*` (así los cuentan y los confirman el mismo check-in y la misma lista). */
export interface IEventGuestRepository {
  count(eventId: string): Promise<number>
  /** Crea la inscripción (estado «registrada», con su código de check-in) y suma al contador del evento. */
  add(eventId: string, g: GuestEntry): Promise<void>
  /** El invitado con ese código de entrada, o null. */
  findByCode(eventId: string, code: string): Promise<{ name: string } | null>
}
