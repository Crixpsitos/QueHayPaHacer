import { SitesList } from "@/presentation/studio/components/sites/SitesList";
import type { OrganizerSiteListItem, GetStudioListParams } from "@/domain/entities/studio/Studio";
import { createServerContainer } from "@/infraestructure/di/container";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { cacheLife } from "next/cache";

const DEFAULT_LIMIT = 12;
const LIMIT_OPTIONS = [12, 24, 48];

// MVP: el grid cambia poco → se cachea 5 minutos. Sin cacheTag por ahora.
async function getCachedOrganizerSites(
  uid: string,
  params: GetStudioListParams,
): Promise<OrganizerSiteListItem[]> {
  "use cache";
  cacheLife("minutes");

  const { studioService } = createServerContainer();
  return studioService.getOrganizerSites(uid, params);
}

interface StudioSitesPageProps {
  searchParams: Promise<{ limit?: string; q?: string }>;
}

export default async function StudioSitesPage({ searchParams }: StudioSitesPageProps) {
  const sp = await searchParams;
  const limit = LIMIT_OPTIONS.includes(Number(sp.limit)) ? Number(sp.limit) : DEFAULT_LIMIT;
  const search = sp.q?.trim() || undefined;

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    return <SitesList sites={[]} limit={limit} limitOptions={LIMIT_OPTIONS} query={search ?? ""} />;
  }

  let sites: OrganizerSiteListItem[] = [];
  try {
    sites = await getCachedOrganizerSites(tokens.decodedToken.uid, { limit, search });
  } catch (error) {
    console.error("[StudioSitesPage] getOrganizerSites failed", error);
  }

  // OrganizerSiteListItem y StudioSiteListItem son estructuralmente idénticos.
  return <SitesList sites={sites} limit={limit} limitOptions={LIMIT_OPTIONS} query={search ?? ""} />;
}
