import { StudioOverview } from "@/presentation/studio/components/overview/StudioOverview";
import type { StudioOverviewViewModel } from "@/presentation/studio/view-models/StudioOverviewViewModel";
import { MOCK_STUDIO_OVERVIEW } from "@/presentation/studio/view-models/StudioOverviewViewModel";
import { StudioOverviewViewModelMapper } from "@/presentation/studio/mapper/StudioOverviewViewModelMapper";
import type { OrganizerOverview } from "@/domain/entities/studio/Studio";
import { createServerContainer } from "@/infraestructure/di/container";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { cacheLife } from "next/cache";

const EMPTY_OVERVIEW: StudioOverviewViewModel = {
  kpis: {
    views: { label: "Total de vistas", value: 0, previousValue: 0, changePct: 0 },
    registrations: { label: "Registros", value: 0, previousValue: 0, changePct: 0 },
    likes: { label: "Likes", value: 0, previousValue: 0, changePct: 0 },
    activeEvents: { label: "Eventos activos", value: 0, previousValue: 0, changePct: 0 },
  },
  viewsVsRegistrations: [],
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
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    return <StudioOverview data={EMPTY_OVERVIEW} />;
  }

  try {
    const overview = await getCachedOrganizerOverview(tokens.decodedToken.uid);
    const data = overview
      ? StudioOverviewViewModelMapper.toViewModel(overview)
      : EMPTY_OVERVIEW;
    // TODO: quitar el fallback cuando getRegistrationsTimeline tenga lógica real (hoy retorna []).
    if (data.registrationsTimeline.length === 0) {
      data.registrationsTimeline = MOCK_STUDIO_OVERVIEW.registrationsTimeline;
    }
    return <StudioOverview data={data} />;
  } catch {
    return <StudioOverview data={EMPTY_OVERVIEW} />;
  }
}
