import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailContainer } from "@/presentation/events/components/EventDetailContainer";
import { EventDetailSkeleton } from "@/presentation/events/components/EventDetailSkeleton";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import {
  fetchEventDetailBySlug,
  fetchEventDetailById,
} from "@/presentation/events/data/eventDetailFetchers";
import { SITE_NAME } from "@/app/lib/site";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = (await fetchEventDetailBySlug(id)) ?? (await fetchEventDetailById(id));
  if (!event || event.status !== "published") return {};

  const url = `/eventos/${event.slug || event.id}`;
  const description = event.shortDescription || `${event.title} en Ibagué.`;

  // og:image lo provee el archivo opengraph-image.tsx (OG dinámica con el mainImage).
  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      locale: "es_CO",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  return (
    <ServerBoundary
      params={params}
      fallback={<EventDetailSkeleton />}
    >
      {({ params: { id } }) => {
        if (!id) return notFound();
        return <EventDetailContainer eventId={id} />;
      }}
    </ServerBoundary>
  );
}
