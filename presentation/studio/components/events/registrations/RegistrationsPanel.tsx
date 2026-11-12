import type { EventRegistrationsViewModel } from "../../../view-models/StudioEventsViewModel";
import type { RegistrationSortBy } from "@/domain/entities/studio/Studio";
import { RegistrationsTable } from "./RegistrationsTable";
import { ExternalClicksPanel } from "./ExternalClicksPanel";
import { EmptyRegistrations } from "./EmptyRegistrations";
import { UserPlus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { EventIncomeCard } from "@/presentation/events/components/EventIncomeCard";
import { EventAttendeesDialog } from "@/presentation/events/components/EventAttendeesDialog";

interface RegistrationsPanelProps {
  data: EventRegistrationsViewModel;
  /** Si viene, los inscritos son de una sesión: las acciones deben escribir en
   *  `events/{id}/sessions/{sid}/registrations`, no en las del evento padre. */
  sessionId?: string;
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
export function RegistrationsPanel({ data, sessionId, sortBy, sortDir, limit, query }: RegistrationsPanelProps) {
  switch (data.registrationType) {
    case "none":
      return <EmptyRegistrations />;
    case "external":
      // Enlace externo: los clics y, debajo, quienes pulsaron «inscribirme» (interesados) para confirmar a quien fue o pagó.
      return (
        <div className="space-y-6">
          <ExternalClicksPanel clicks={data.externalClicks ?? 0} url={data.externalUrl} />
          {/* Personas sin cuenta: se agregan aquí, con su entrada QR (el diálogo lista, confirma y agrega). */}
          <EventAttendeesDialog
            eventId={data.eventId}
            eventTitle="Evento"
            trigger={
              <Button type="button">
                <UserPlus className="h-4 w-4" aria-hidden /> Agregar persona sin cuenta
              </Button>
            }
          />
          {data.tiers?.length ? <EventIncomeCard eventId={data.eventId} /> : null}
          <RegistrationsTable
            eventId={data.eventId}
            sessionId={sessionId}
            rows={data.rows}
            sortBy={sortBy}
            sortDir={sortDir}
            limit={limit}
            query={query}
            nextCursor={data.nextCursor}
            prevCursor={data.prevCursor}
            requiresAttendance
            tiers={data.tiers}
            permissions={data.permissions}
          />
        </div>
      );
    case "form":
      return (
        <RegistrationsTable
          eventId={data.eventId}
          sessionId={sessionId}
          rows={data.rows}
          sortBy={sortBy}
          sortDir={sortDir}
          limit={limit}
          query={query}
          nextCursor={data.nextCursor}
          prevCursor={data.prevCursor}
          requiresAttendance={data.requiresAttendance}
          permissions={data.permissions}
          withFormResponses
        />
      );
    case "internal":
    default:
      return (
        <RegistrationsTable
          eventId={data.eventId}
          sessionId={sessionId}
          rows={data.rows}
          sortBy={sortBy}
          sortDir={sortDir}
          limit={limit}
          query={query}
          nextCursor={data.nextCursor}
          prevCursor={data.prevCursor}
          requiresAttendance={data.requiresAttendance}
          permissions={data.permissions}
        />
      );
  }
}
