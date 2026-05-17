import type { EventViewModel } from "../view-models/EventViewModel";

/**
 * Convierte un string ISO 8601 a un objeto Date.
 * Lanza un error si la cadena no produce una fecha válida.
 */
export function parseISODate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: "${dateString}"`);
  }
  return date;
}

/**
 * Resultado de parsear todas las fechas de un EventViewModel.
 */
export interface EventParsedDates {
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  promotion: {
    promotedAt: Date;
    promotedUntil: Date;
  };
}

/**
 * Extrae y convierte todas las fechas de un EventViewModel a objetos Date.
 */
export function parseEventDates(vm: EventViewModel): EventParsedDates {
  return {
    startDate: parseISODate(vm.startDate),
    endDate: parseISODate(vm.endDate),
    createdAt: parseISODate(vm.createdAt),
    updatedAt: parseISODate(vm.updatedAt),
    publishedAt: vm.publishedAt ? parseISODate(vm.publishedAt) : undefined,
    promotion: {
      promotedAt: parseISODate(vm.promotion.promotedAt),
      promotedUntil: parseISODate(vm.promotion.promotedUntil),
    },
  };
}
