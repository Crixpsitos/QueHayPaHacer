import type { EventSession } from "@/domain/entities/events/EventSession";

/**
 * Determina si una sesión tiene los datos mínimos para considerarse configurada.
 * Una sesión puede existir como borrador sin estar completa.
 */
export function isSessionComplete(session: EventSession): boolean {
  // Título válido (mínimo 3 caracteres)
  if (!session.title?.trim() || session.title.trim().length < 3) return false;
  // Descripción con contenido real
  if (!Array.isArray(session.description?.content) || session.description!.content!.length === 0)
    return false;
  // Fechas definidas
  if (!session.startDate || !session.endDate) return false;
  // Ubicación con venue y ciudad
  if (!session.location?.venue?.trim() || !session.location?.city?.name?.trim()) return false;
  return true;
}
