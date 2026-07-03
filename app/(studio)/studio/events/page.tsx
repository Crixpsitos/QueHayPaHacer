import { EventsList } from "@/presentation/studio/components/events/EventsList";
import type { StudioEventListItem } from "@/presentation/studio/view-models/StudioEventsViewModel";
import type {
  GetOrganizerEventsParams,
  OrganizerEventsPage,
} from "@/domain/entities/studio/Studio";
import { createServerContainer } from "@/infraestructure/di/container";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { cacheLife } from "next/cache";

const DEFAULT_LIMIT = 10;
const LIMIT_OPTIONS = [10, 25, 50];

const EMPTY_PAGE: OrganizerEventsPage = { events: [], nextCursor: null, prevCursor: null };

// MVP: la tabla no cambia mucho, así que se cachea 5 minutos. Sin cacheTag por
// ahora — no hay ningún flujo que necesite invalidarla a demanda todavía.
async function getCachedOrganizerEvents(
  uid: string,
  params: GetOrganizerEventsParams,
): Promise<OrganizerEventsPage> {
  "use cache";
  cacheLife("minutes");

  const { studioService } = createServerContainer();
  return studioService.getOrganizerEvents(uid, params);
}

function toViewModel(page: OrganizerEventsPage): StudioEventListItem[] {
  return page.events.map((e) => ({
    id: e.eventId,
    name: e.name,
    date: e.date.toISOString(),
    status: e.status,
    image: e.image,
    views: e.views,
    registrations: e.registrations,
    registrationType: e.registrationType,
  }));
}

interface StudioEventsPageProps {
  searchParams: Promise<{ cursor?: string; direction?: string; limit?: string; q?: string }>;
}

export default async function StudioEventsPage({ searchParams }: StudioEventsPageProps) {
  const sp = await searchParams;
  const limit = LIMIT_OPTIONS.includes(Number(sp.limit)) ? Number(sp.limit) : DEFAULT_LIMIT;
  const direction = sp.direction === "prev" ? "prev" : "next";
  const search = sp.q?.trim() || undefined;

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    return (
      <EventsList
        events={[]}
        limit={limit}
        limitOptions={LIMIT_OPTIONS}
        query={search ?? ""}
        nextCursor={null}
        prevCursor={null}
      />
    );
  }

  let page = EMPTY_PAGE;
  try {
    page = await getCachedOrganizerEvents(tokens.decodedToken.uid, {
      limit,
      cursor: sp.cursor,
      direction,
      search,
    });
  } catch (error) {
    console.error("[StudioEventsPage] getOrganizerEvents failed", error);
    page = EMPTY_PAGE;
  }

  return (
    <EventsList
      events={toViewModel(page)}
      limit={limit}
      limitOptions={LIMIT_OPTIONS}
      query={search ?? ""}
      nextCursor={page.nextCursor}
      prevCursor={page.prevCursor}
    />
  );
}
