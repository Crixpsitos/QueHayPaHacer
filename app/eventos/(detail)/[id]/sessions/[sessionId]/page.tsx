import { notFound } from "next/navigation";
import { EventDetailSkeleton } from "@/presentation/events/components/EventDetailSkeleton";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import { SessionDetailContainer } from "@/presentation/events/components/SessionDetailContainer";
import { fetchEventDetailById, fetchEventDetailBySlug, fetchEventSessions } from "@/presentation/events/data/eventDetailFetchers";
import { SITE_NAME } from "@/app/lib/site";
import type { Metadata } from "next";

interface SessionDetailPageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

export async function generateMetadata({ params }: SessionDetailPageProps): Promise<Metadata> {
  const { id, sessionId } = await params;
  const parent = (await fetchEventDetailBySlug(id)) ?? (await fetchEventDetailById(id));
  if (!parent || parent.status !== "published" || parent.eventType !== "multi-date") return { robots: { index: false, follow: false } };
  const sessions = await fetchEventSessions(parent.id);
  const session = sessions.find((s) => s.slug === sessionId) ?? sessions.find((s) => s.id === sessionId);
  if (!session || session.status !== "published") return { robots: { index: false, follow: false } };
  // Fechas terminadas hace más de 90 días: no aportan (y salen del sitemap con el mismo corte).
  if (session.endDate.getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000) return { robots: { index: false, follow: true } };

  const url = `/eventos/${parent.slug || parent.id}/sessions/${session.slug || session.id}`;
  const title = session.title || parent.title;
  const description = session.shortDescription || parent.shortDescription || `${parent.title} en Ibagué.`;
  const ogImage = { url: `/og/event/${parent.slug || parent.id}`, width: 1200, height: 630, alt: parent.title };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: SITE_NAME, locale: "es_CO", images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage.url] },
  };
}

/**
 * Con Cache Components, los datos sin cachear (cookies del usuario) deben leerse
 * dentro de un <Suspense> o el prerender falla. `ServerBoundary` lo envuelve,
 * igual que el detalle del evento.
 */
export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <ServerBoundary params={params} fallback={<EventDetailSkeleton />}>
      {({ params: { id, sessionId } }) => {
        if (!id || !sessionId) return notFound();
        return <SessionDetailContainer eventId={id} sessionRef={sessionId} />;
      }}
    </ServerBoundary>
  );
}
