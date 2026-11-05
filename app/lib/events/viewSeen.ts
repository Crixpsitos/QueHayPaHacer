type Store = Pick<Storage, "getItem" | "setItem">;

const key = (uid: string, eventId: string) => `qhpa:event-seen:${uid}:${eventId}`;

/**
 * "Esta persona ya vio este evento" (recuerdo del navegador). Solo sirve para NO pedirle al servidor que lo vuelva a
 * comprobar (ahorra una lectura por visita repetida); el servidor sigue siendo el que decide si la vista cuenta.
 */
export function hasSeenEvent(uid: string, eventId: string, storage?: Store): boolean {
  try {
    return (storage ?? localStorage).getItem(key(uid, eventId)) === "1";
  } catch {
    return false;
  }
}

export function markEventSeen(uid: string, eventId: string, storage?: Store): void {
  try {
    (storage ?? localStorage).setItem(key(uid, eventId), "1");
  } catch {}
}
