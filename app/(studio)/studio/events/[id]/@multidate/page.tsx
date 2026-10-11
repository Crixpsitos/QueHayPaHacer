import { notFound } from "next/navigation";
import { isStudioEventOwner } from "@/app/actions/_session";
import { getCachedMultiDateEventStats } from "@/presentation/studio/lib/cachedStudioData";
import { MultiDateStatsPanel } from "@/presentation/studio/components/events/MultiDateStatsPanel";

interface SlotProps {
  params: Promise<{ id: string }>;
}

export default async function EventMultiDateSlot({ params }: SlotProps) {
  const { id } = await params;
  // Dueño + Premium aquí (no basta el layout): stats e inscritos traen PII.
  if (!(await isStudioEventOwner(id))) notFound();

  const stats = await getCachedMultiDateEventStats(id);
  if (!stats) notFound();

  return <MultiDateStatsPanel stats={stats} />;
}
