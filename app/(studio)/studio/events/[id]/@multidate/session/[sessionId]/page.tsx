import { notFound } from "next/navigation";
import { EventStatsPanel } from "@/presentation/studio/components/events/EventStatsPanel";
import { RegistrationsPanel } from "@/presentation/studio/components/events/registrations/RegistrationsPanel";
import { DraftEventNotice } from "@/presentation/studio/components/events/registrations/DraftEventNotice";
import { SessionDetailHeader } from "@/presentation/studio/components/events/SessionDetailHeader";
import {
  getCachedEventRegistrations,
  getCachedEventStats,
} from "@/presentation/studio/lib/cachedStudioData";
import { toEventStatsViewModel } from "@/presentation/studio/mapper/EventStatsViewModelMapper";
import { toEventRegistrationsViewModel } from "@/presentation/studio/mapper/EventRegistrationsViewModelMapper";

interface SlotProps {
  params: Promise<{ id: string; sessionId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const LIMIT_OPTIONS = [10, 25, 50, 100];
const DEFAULT_LIMIT = 10;

/**
 * Detalle de una sesión en el Estudio: MISMO diseño que un evento normal
 * (encabezado + gráficas + tabla de inscritos), porque una sesión tiene su
 * propia fecha, `registrationType` y subcolección `registrations`.
 *
 * Vive dentro del slot `@multidate` (no en `children`) para que el layout, que
 * ya ramifica por `eventType`, la renderice sin activar los slots
 * `stats`/`registrations`, que asumen un evento único.
 */
export default async function StudioSessionDetailPage({
  params,
  searchParams,
}: SlotProps) {
  const { id, sessionId } = await params;
  const sp = await searchParams;

  const sortBy = sp.sort === "name" ? "name" : "registeredAt";
  const sortDir = sp.dir === "asc" ? "asc" : "desc";
  const limitRaw = Number(sp.limit);
  const limit = LIMIT_OPTIONS.includes(limitRaw) ? limitRaw : DEFAULT_LIMIT;
  const search = typeof sp.q === "string" ? sp.q.trim() || undefined : undefined;
  const cursor = typeof sp.cursor === "string" ? sp.cursor : undefined;
  const direction = sp.direction === "prev" ? "prev" : "next";

  const domainStats = await getCachedEventStats(id, sessionId);
  if (!domainStats) notFound();

  const stats = toEventStatsViewModel(domainStats);

  return (
    <div className="space-y-6">
      <SessionDetailHeader
        eventId={id}
        name={stats.name}
        status={stats.status}
        date={stats.date}
        registrationType={stats.registrationType}
      />

      <EventStatsPanel stats={stats} hideLikes />

      {stats.status.toLowerCase() === "draft" ? (
        <DraftEventNotice eventId={id} />
      ) : (
        <SessionRegistrations
          eventId={id}
          sessionId={sessionId}
          registrationType={domainStats.registrationType}
          sortBy={sortBy}
          sortDir={sortDir}
          limit={limit}
          cursor={cursor}
          direction={direction}
          search={search}
        />
      )}
    </div>
  );
}

async function SessionRegistrations({
  eventId,
  sessionId,
  registrationType,
  sortBy,
  sortDir,
  limit,
  cursor,
  direction,
  search,
}: {
  eventId: string;
  sessionId: string;
  registrationType: Parameters<typeof toEventRegistrationsViewModel>[1];
  sortBy: "name" | "registeredAt";
  sortDir: "asc" | "desc";
  limit: number;
  cursor?: string;
  direction: "next" | "prev";
  search?: string;
}) {
  const result = await getCachedEventRegistrations(
    eventId,
    { sortBy, sortDir, limit, cursor, direction, search },
    sessionId,
  );

  // El id del VM debe ser el del evento PADRE: la tabla lo combina con
  // `sessionId` para escribir en `events/{id}/sessions/{sid}/registrations`.
  const data = toEventRegistrationsViewModel(eventId, registrationType, result);

  return (
    <RegistrationsPanel
      data={data}
      sessionId={sessionId}
      sortBy={sortBy}
      sortDir={sortDir}
      limit={limit}
      query={search ?? ""}
    />
  );
}
