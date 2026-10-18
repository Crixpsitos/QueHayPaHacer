import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventTeamSection } from "@/presentation/studio/components/events/EventTeamSection";
import { requireEventPermission } from "@/app/actions/_session";
import { getCachedMultiDateEventStats } from "@/presentation/studio/lib/cachedStudioData";
import { MultiDateStatsPanel } from "@/presentation/studio/components/events/MultiDateStatsPanel";

interface SlotProps {
  params: Promise<{ id: string }>;
}

export default async function EventMultiDateSlot({ params }: SlotProps) {
  const { id } = await params;
  // Permiso por rol aquí (no basta el layout). Es la entrada a las fechas (también para control de acceso).
  const access = await requireEventPermission(id, "view_event_studio");
  if (!access) notFound();

  const stats = await getCachedMultiDateEventStats(id);
  if (!stats) notFound();

  return (
    <div className="space-y-6">
      <MultiDateStatsPanel stats={stats} viewerRole={access.role} />
      <Suspense fallback={null}>
        <EventTeamSection eventId={id} role={access.role} />
      </Suspense>
    </div>
  );
}
