import { getCachedUserBadges, getCachedUserEvents, getCachedUserSites } from "../lib/cachedProfileData";
import { PublicProfileTabs } from "./PublicProfileTabs";

/** Listas públicas leídas en el servidor desde caché (etiquetas profile-events/sites/badges-<uid>). */
export async function PublicProfileTabsData({ uid }: { uid: string }) {
  const [events, sites, badges] = await Promise.all([
    getCachedUserEvents(uid),
    getCachedUserSites(uid),
    getCachedUserBadges(uid),
  ]);
  return (
    <PublicProfileTabs
      events={events.filter((event) => event.status === "published")}
      sites={sites.filter((site) => site.publicationStatus === "published")}
      badges={badges}
    />
  );
}

export function PublicProfileTabsSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="h-11 w-full animate-pulse rounded bg-muted/50" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-video animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
