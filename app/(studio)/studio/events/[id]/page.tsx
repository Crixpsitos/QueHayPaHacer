import { notFound } from "next/navigation";
import { requireEventPermission } from "@/app/actions/_session";
import { Suspense } from "react";
import { EventTeamSection, TeamRoleBanner } from "@/presentation/studio/components/events/EventTeamSection";
import { EventDetailHeader } from "@/presentation/studio/components/events/EventDetailHeader";
import { getCachedEventStats } from "@/presentation/studio/lib/cachedStudioData";
import { toEventStatsViewModel } from "@/presentation/studio/mapper/EventStatsViewModelMapper";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  // Permiso por rol aquí (no basta el layout): stats e inscritos traen PII.
  const access = await requireEventPermission(id, "view_event_studio");
  if (!access) notFound();

  // Cacheado y COMPARTIDO con los slots @stats/@registrations: los tres piden
  // las mismas stats, sin caché eran 3 lecturas a Firestore por vista.
  const domainStats = await getCachedEventStats(id);
  if (!domainStats) notFound();

  const stats = toEventStatsViewModel(domainStats, access.role);

  return (
    <div className="space-y-6">
    <TeamRoleBanner role={access.role} />
    <EventDetailHeader
      eventId={stats.eventId}
      name={stats.name}
      status={stats.status}
      date={stats.date}
      registrationType={stats.registrationType}
      viewerRole={stats.viewerRole}
    />
    <Suspense fallback={null}>
      <EventTeamSection eventId={id} role={access.role} />
    </Suspense>
    </div>
  );
}
