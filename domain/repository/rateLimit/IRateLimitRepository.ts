/**
 * Límites que valen para TODAS las instancias del servidor (Cloud Run puede tener varias): se guardan en la base,
 * no en memoria. Cada operación es atómica: dos peticiones simultáneas no pasan las dos.
 */
export interface IRateLimitRepository {
  /** true si pasó (y queda registrado el instante); false si hubo otro golpe dentro de `windowMs`. */
  tryHit(key: string, windowMs: number, now: Date): Promise<boolean>
  /** Olvida el golpe (si no se guardó nada, la persona no queda castigada por corregir un error). */
  release(key: string): Promise<void>
  /** Suma 1 al contador del día; false (sin sumar) si ya llegó a `max`. */
  incrementDaily(key: string, day: string, max: number): Promise<boolean>
}
