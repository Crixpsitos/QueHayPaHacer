import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/app/components/layout/shared/Section";
import { SiteCollectionContent } from "@/presentation/sites/components/discovery/SiteCollectionContent";
import { SiteDetailContainer } from "@/presentation/sites/components/detail/SiteDetailContainer";
import { getSiteCollectionBySlug } from "@/presentation/sites/lib/siteCollections";
import { createServerContainer } from "@/infraestructure/di/container";
import { SITE_NAME } from "@/app/lib/site";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getSiteDetail(id: string): Promise<SiteDetail | null> {
  const { sitesService } = createServerContainer();
  // Intenta por slug primero (URL canónica), luego por ID de Firestore
  return (await sitesService.getSiteDetailBySlug(id)) ?? sitesService.getSiteDetailById(id);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const def = getSiteCollectionBySlug(id);
  if (def) {
    const url = `/donde-ir-${def.slug}`;
    return {
      title: def.metaTitle,
      description: def.metaDescription,
      alternates: { canonical: url },
      openGraph: { title: def.metaTitle, description: def.metaDescription, url, type: "website", siteName: SITE_NAME, locale: "es_CO" },
    };
  }

  const site = await getSiteDetail(id);
  if (!site) return { robots: { index: false, follow: false } };

  const siteUrl = `/donde-ir/${site.slug || id}`;
  const description = site.description || `Descubre ${site.name} en Ibagué: horarios, ubicación y eventos.`;
  const images = site.coverUrl
    ? [{ url: site.coverUrl, width: 1200, height: 630, alt: site.name }]
    : [];

  return {
    title: site.name,
    description,
    alternates: { canonical: siteUrl },
    openGraph: {
      title: site.name,
      description,
      url: siteUrl,
      images,
      type: "website",
      siteName: SITE_NAME,
      locale: "es_CO",
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description,
      ...(images[0] ? { images: [images[0].url] } : {}),
    },
  };
}

export default async function DondeIrDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<SiteDetailSkeleton />}>
      <DondeIrDetail params={params} />
    </Suspense>
  );
}

async function DondeIrDetail({ params }: PageProps) {
  const { id } = await params;

  // Colección de sitios
  const def = getSiteCollectionBySlug(id);
  if (def) {
    return (
      <>
        <Section spacing="sm" className="mt-4">
          <h1 className="text-3xl font-bold">{def.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {def.description}
          </p>
        </Section>
        <SiteCollectionContent def={def} />
      </>
    );
  }

  // Detalle de sitio individual — buscar por slug primero, luego por ID
  const site = await getSiteDetail(id);
  if (!site) notFound();

  // Pasar el Firestore ID real (no el slug del param) al contenedor
  return <SiteDetailContainer siteId={site!.id} />;
}

// ── Skeleton propio del detalle de sitio ────────────────────────────────────
function SiteDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:max-w-6xl">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl border border-border">
        <div className="min-h-64 animate-pulse bg-muted sm:min-h-80" />
        <div className="grid grid-cols-2 gap-0.5">
          {[1,2,3,4].map((i) => (
            <div key={i} className="aspect-square animate-pulse bg-muted" />
          ))}
        </div>
      </div>
      <div className="mb-8 space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {[80,60,70,50,65].map((w, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
