import type {
  EventRegistrationsResult,
  RegistrationType,
} from "@/domain/entities/studio/Studio";
import type {
  EventRegistrationsViewModel,
  RegistrationRow,
} from "../view-models/StudioEventsViewModel";

/**
 * Convierte el dominio `EventRegistrationsResult` al ViewModel de presentación.
 * Si `result` es null (consulta aún sin implementar), devuelve un VM vacío para
 * que el panel renderice sin datos en vez de provocar un 404.
 */
export function toEventRegistrationsViewModel(
  eventId: string,
  registrationType: RegistrationType,
  result: EventRegistrationsResult | null,
): EventRegistrationsViewModel {
  if (!result) {
    return { eventId, registrationType, rows: [], requiresAttendance: false, nextCursor: null, prevCursor: null };
  }

  const rows: RegistrationRow[] = result.registrations.map((r) => {
    const fullName = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();
    return {
      userId: r.userId,
      // Nombre completo; si no hay, cae al displayName y por último a un genérico.
      name: fullName || r.displayName || "Sin nombre",
      // El "@handle" es exclusivo de cuentas profesionales (y solo si además hay
      // nombre completo; si no, el displayName ya se usó como nombre principal).
      handle: r.isProfessional && fullName && r.displayName ? r.displayName : undefined,
      // Chulito de verificado: solo para cuentas profesionales.
      verified: r.isProfessional,
      photoURL: r.photoURL,
      registeredAt: r.registeredAt.toISOString(),
      attendanceConfirmed: r.attendanceConfirmed,
      formResponses: r.formResponses?.map((f) => ({
        label: f.label,
        value: f.value,
      })),
    };
  });

  return {
    eventId,
    registrationType: result.registrationType,
    rows,
    externalClicks: result.externalClicks,
    externalUrl: result.externalUrl,
    requiresAttendance: result.requiresAttendance,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
  };
}
