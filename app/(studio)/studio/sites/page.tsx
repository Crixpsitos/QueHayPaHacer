import type { Metadata } from "next";
import { getPremiumSessionUid, redirectLimitedToEvents } from "@/app/actions/_session";
import { SitesList } from "@/presentation/studio/components/sites/SitesList";
import type { OrganizerSiteListItem, GetStudioListParams } from "@/domain/entities/studio/Studio";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";

export const metadata: Metadata = { title: "Sitios" };

const DEFAULT_LIMIT = 12;
const LIMIT_OPTIONS = [12, 24, 48];

// Tag por organizador → las actions de sitios (publish/update/draft/delete/active)
// invalidan `sites-<uid>` con updateTag para read-your-own-writes sin esperar TTL.
async function getCachedOrganizerSites(
  uid: string,
  params: GetStudioListParams,
): Promise<OrganizerSiteListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`sites-${uid}`);

  const { studioService } = createServerContainer();
  return studioService.getOrganizerSites(uid, params);
}

interface StudioSitesPageProps {
  searchParams: Promise<{ limit?: string; q?: string }>;
}

export default async function StudioSitesPage({ searchParams }: StudioSitesPageProps) {
  await redirectLimitedToEvents();

  const sp = await searchParams;
  const limit = LIMIT_OPTIONS.includes(Number(sp.limit)) ? Number(sp.limit) : DEFAULT_LIMIT;
  const search = sp.q?.trim() || undefined;

  // Premium verificado aquí también: el layout (StudioGate) no protege requests RSC directas.
  const uid = await getPremiumSessionUid();
  if (!uid) {
    return <SitesList sites={[]} limit={limit} limitOptions={LIMIT_OPTIONS} query={search ?? ""} />;
  }

  let sites: OrganizerSiteListItem[] = [];
  try {
    sites = await getCachedOrganizerSites(uid, { limit, search });
  } catch (error) {
    console.error("[StudioSitesPage] getOrganizerSites failed", error);
  }

  // OrganizerSiteListItem y StudioSiteListItem son estructuralmente idénticos.
  return <SitesList sites={sites} limit={limit} limitOptions={LIMIT_OPTIONS} query={search ?? ""} />;
}
