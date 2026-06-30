import { notFound } from "next/navigation";
import { EventStatsPanel } from "@/presentation/studio/components/events/EventStatsPanel";
import { createServerContainer } from "@/infraestructure/di/container";
import { toEventStatsViewModel } from "@/presentation/studio/mapper/EventStatsViewModelMapper";

interface SlotProps {
  params: Promise<{ id: string }>;
}

export default async function EventStatsSlot({ params }: SlotProps) {
  const { id } = await params;

  const { studioService } = createServerContainer();
  const domainStats = await studioService.getEventStats(id);
  if (!domainStats) notFound();

  const stats = toEventStatsViewModel(domainStats);

  return <EventStatsPanel stats={stats} />;
}
