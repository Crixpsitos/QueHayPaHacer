import { notFound } from "next/navigation";
import { isStudioEventOwner } from "@/app/actions/_session";
import { EventStatsPanel } from "@/presentation/studio/components/events/EventStatsPanel";
import { getCachedEventStats } from "@/presentation/studio/lib/cachedStudioData";
import { toEventStatsViewModel } from "@/presentation/studio/mapper/EventStatsViewModelMapper";

interface SlotProps {
  params: Promise<{ id: string }>;
}

export default async function EventStatsSlot({ params }: SlotProps) {
  const { id } = await params;
  // Dueño + Premium aquí (no basta el layout): stats e inscritos traen PII.
  if (!(await isStudioEventOwner(id))) notFound();

  const domainStats = await getCachedEventStats(id);
  if (!domainStats) notFound();

  const stats = toEventStatsViewModel(domainStats);

  return <EventStatsPanel stats={stats} />;
}
