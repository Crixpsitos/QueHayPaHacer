import { notFound } from "next/navigation";
import { RegistrationsPanel } from "@/presentation/studio/components/events/registrations/RegistrationsPanel";
import { DraftEventNotice } from "@/presentation/studio/components/events/registrations/DraftEventNotice";
import { createServerContainer } from "@/infraestructure/di/container";
import { toEventRegistrationsViewModel } from "@/presentation/studio/mapper/EventRegistrationsViewModelMapper";

interface SlotProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const LIMIT_OPTIONS = [10, 25, 50, 100];
const DEFAULT_LIMIT = 10;

export default async function EventRegistrationsSlot({ params, searchParams }: SlotProps) {
  const { id } = await params;
  const sp = await searchParams;

  // Orden, límite, búsqueda y paginación vienen por query params:
  // ?sort=&dir=&limit=&q=&cursor=&direction=
  const sortBy = sp.sort === "name" ? "name" : "registeredAt";
  const sortDir = sp.dir === "asc" ? "asc" : "desc";
  const limitRaw = Number(sp.limit);
  const limit = LIMIT_OPTIONS.includes(limitRaw) ? limitRaw : DEFAULT_LIMIT;
  const search = typeof sp.q === "string" ? sp.q.trim() || undefined : undefined;
  const cursor = typeof sp.cursor === "string" ? sp.cursor : undefined;
  const direction = sp.direction === "prev" ? "prev" : "next";

  const { studioService } = createServerContainer();
  const stats = await studioService.getEventStats(id);
  if (!stats) notFound();

  // Si el evento es borrador, no hay datos que recolectar todavía.
  if (stats.status.toLowerCase() === "draft") {
    return <DraftEventNotice eventId={id} />;
  }

  const result = await studioService.getEventRegistrations(id, {
    sortBy,
    sortDir,
    limit,
    cursor,
    direction,
    search,
  });
  const data = toEventRegistrationsViewModel(id, stats.registrationType, result);

  return (
    <RegistrationsPanel
      data={data}
      sortBy={sortBy}
      sortDir={sortDir}
      limit={limit}
      query={search ?? ""}
    />
  );
}
