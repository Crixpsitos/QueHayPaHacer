import { notFound } from "next/navigation";
import { requireEventPermission } from "@/app/actions/_session";
import { can } from "@/domain/entities/events/teamAccess";
import { EventStatsPanel } from "@/presentation/studio/components/events/EventStatsPanel";
import { getCachedEventStats } from "@/presentation/studio/lib/cachedStudioData";
import { toEventStatsViewModel } from "@/presentation/studio/mapper/EventStatsViewModelMapper";

interface SlotProps {
  params: Promise<{ id: string }>;
}

export default async function EventStatsSlot({ params }: SlotProps) {
  const { id } = await params;
  // Permiso por rol aquí (no basta el layout). Control de acceso entra al Studio pero no ve estadísticas.
  const access = await requireEventPermission(id, "view_event_studio");
  if (!access) notFound();
  if (!can(access.role, "view_stats")) return null;

  const domainStats = await getCachedEventStats(id);
  if (!domainStats) notFound();

  const stats = toEventStatsViewModel(domainStats, access.role);

  return <EventStatsPanel stats={stats} />;
}
