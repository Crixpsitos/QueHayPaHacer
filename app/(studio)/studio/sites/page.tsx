import { SitesList } from "@/presentation/studio/components/sites/SitesList";
import { MOCK_STUDIO_SITES } from "@/presentation/studio/lib/studioSitesMock";

export default function StudioSitesPage() {
  // MOCK por ahora. Cuando implementes el repositorio:
  //   const { studioService } = createServerContainer();
  //   const sites = await studioService.getOrganizerSites(uid); // (añadir al repo)
  return <SitesList sites={MOCK_STUDIO_SITES} />;
}
