import { notFound } from "next/navigation";
import { SiteDetail } from "@/presentation/studio/components/sites/SiteDetail";
import { getMockSiteDetail } from "@/presentation/studio/lib/studioSitesMock";

interface SiteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const { id } = await params;

  // MOCK por ahora. Sustituir por studioService.getSiteAnalytics(id) + getEventsBySite(id).
  const site = getMockSiteDetail(id);
  if (!site) notFound();

  return <SiteDetail site={site} />;
}
