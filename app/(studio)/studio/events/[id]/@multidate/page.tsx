import { notFound } from "next/navigation";
import { getCachedMultiDateEventStats } from "@/presentation/studio/lib/cachedStudioData";
import { MultiDateStatsPanel } from "@/presentation/studio/components/events/MultiDateStatsPanel";

interface SlotProps {
  params: Promise<{ id: string }>;
}

export default async function EventMultiDateSlot({ params }: SlotProps) {
  const { id } = await params;

  const stats = await getCachedMultiDateEventStats(id);
  if (!stats) notFound();

  return <MultiDateStatsPanel stats={stats} />;
}
