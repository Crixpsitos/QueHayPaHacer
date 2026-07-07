import { notFound } from "next/navigation";
import { EventDetailHeader } from "@/presentation/studio/components/events/EventDetailHeader";
import { getCachedEventStats } from "@/presentation/studio/lib/cachedEventStats";
import { toEventStatsViewModel } from "@/presentation/studio/mapper/EventStatsViewModelMapper";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  const domainStats = await getCachedEventStats(id);
  if (!domainStats) notFound();

  const stats = toEventStatsViewModel(domainStats);

  return (
    <EventDetailHeader
      eventId={stats.eventId}
      name={stats.name}
      status={stats.status}
      date={stats.date}
      registrationType={stats.registrationType}
    />
  );
}
