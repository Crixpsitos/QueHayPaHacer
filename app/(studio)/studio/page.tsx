import type { Metadata } from "next";
import { getPremiumSessionUid } from "@/app/actions/_session";
import { StudioOverview } from "@/presentation/studio/components/overview/StudioOverview";
import type { StudioOverviewViewModel } from "@/presentation/studio/view-models/StudioOverviewViewModel";
import { StudioOverviewViewModelMapper } from "@/presentation/studio/mapper/StudioOverviewViewModelMapper";
import type { OrganizerOverview } from "@/domain/entities/studio/Studio";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife } from "next/cache";

export const metadata: Metadata = { title: "Resumen" };

const EMPTY_OVERVIEW: StudioOverviewViewModel = {
  kpis: {
    views: { label: "Vistas de eventos creados este mes", value: 0, previousValue: 0, changePct: 0 },
    registrations: { label: "Inscripciones de eventos creados este mes", value: 0, previousValue: 0, changePct: 0 },
    likes: { label: "Likes de eventos creados este mes", value: 0, previousValue: 0, changePct: 0 },
    activeEvents: { label: "Eventos activos", value: 0, previousValue: 0, changePct: 0 },
  },
  conversion: [],
  registrationsTimeline: [],
  topEvents: [],
  interactivity: [],
};

// MVP: los datos del overview no cambian mucho, así que se cachean 5 minutos.
// Sin cacheTag por ahora — no hay ningún flujo que necesite invalidarlo a demanda.
async function getCachedOrganizerOverview(uid: string): Promise<OrganizerOverview | null> {
  "use cache";
  cacheLife("minutes");

  const { studioService } = createServerContainer();
  return studioService.getOrganizerOverview(uid);
}

export default async function StudioOverviewPage() {
  // Premium verificado aquí también: el layout (StudioGate) no protege requests RSC directas.
  const uid = await getPremiumSessionUid();
  if (!uid) {
    return <StudioOverview data={EMPTY_OVERVIEW} />;
  }

  const overview = await getCachedOrganizerOverview(uid).catch(() => null);
  const data = overview ? StudioOverviewViewModelMapper.toViewModel(overview) : EMPTY_OVERVIEW;
  return <StudioOverview data={data} />;
}
