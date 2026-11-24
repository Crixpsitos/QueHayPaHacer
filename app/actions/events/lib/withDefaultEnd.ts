import { resolveEnd } from "@/domain/entities/events/openEnd";

/**
 * Un evento de una fecha sin fin dura hasta el final de su día de inicio. Se completa antes de validar: el resto de la app
 * (listados, «ya pasó», registros) siempre lee una fecha de fin. Los multi-fecha toman sus fechas de las sesiones.
 */
export function withDefaultEnd<T extends { startDate?: string | Date; endDate?: string | Date; eventType?: string }>(event: T): T {
  if (!event.startDate || event.endDate || event.eventType === "multi-date") return event;
  return { ...event, endDate: resolveEnd(event.startDate).toISOString() };
}
