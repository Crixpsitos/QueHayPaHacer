import type { EventRegistrationsViewModel } from "../../../view-models/StudioEventsViewModel";
import type { RegistrationSortBy } from "@/domain/entities/studio/Studio";
import { RegistrationsTable } from "./RegistrationsTable";
import { ExternalClicksPanel } from "./ExternalClicksPanel";
import { EmptyRegistrations } from "./EmptyRegistrations";

interface RegistrationsPanelProps {
  data: EventRegistrationsViewModel;
  /** Orden, límite y búsqueda actuales (vienen de los query params del slot). */
  sortBy: RegistrationSortBy;
  sortDir: "asc" | "desc";
  limit: number;
  query: string;
}

/**
 * SLOT B — el contenido cambia según el tipo de registro del evento:
 * none → vacío · internal → tabla · external → contador · form → tabla + respuestas.
 */
export function RegistrationsPanel({ data, sortBy, sortDir, limit, query }: RegistrationsPanelProps) {
  switch (data.registrationType) {
    case "none":
      return <EmptyRegistrations />;
    case "external":
      return <ExternalClicksPanel clicks={data.externalClicks ?? 0} url={data.externalUrl} />;
    case "form":
      return (
        <RegistrationsTable
          eventId={data.eventId}
          rows={data.rows}
          sortBy={sortBy}
          sortDir={sortDir}
          limit={limit}
          query={query}
          nextCursor={data.nextCursor}
          prevCursor={data.prevCursor}
          requiresAttendance={data.requiresAttendance}
          withFormResponses
        />
      );
    case "internal":
    default:
      return (
        <RegistrationsTable
          eventId={data.eventId}
          rows={data.rows}
          sortBy={sortBy}
          sortDir={sortDir}
          limit={limit}
          query={query}
          nextCursor={data.nextCursor}
          prevCursor={data.prevCursor}
          requiresAttendance={data.requiresAttendance}
        />
      );
  }
}
