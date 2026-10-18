import type { UserEvent } from "@/domain/repository/profile/IProfileRepository";

export type EventKind = "published" | "review" | "draft" | "rejected" | "other";
export type EventTab = "all" | "published" | "review" | "draft";

export const TABS: { value: EventTab; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "review", label: "En revisión" },
  { value: "draft", label: "Borradores" },
];

/** status + moderationStatus → estado que entiende el creador. */
export function eventKind(event: Pick<UserEvent, "status" | "moderationStatus">): EventKind {
  if (event.status === "rejected" || event.moderationStatus === "rejected") return "rejected";
  if (event.status === "draft") return "draft";
  if (event.status === "pending") return "review";
  if (event.status === "published") return "published";
  return "other";
}

export function matchesTab(event: UserEvent, tab: EventTab): boolean {
  return tab === "all" || eventKind(event) === tab;
}

const time = (d?: Date | string) => (d ? new Date(d).getTime() : NaN);

/** Próximos primero (el más cercano arriba), luego borradores, luego el resto (más reciente arriba). */
export function sortEvents(events: UserEvent[], now = Date.now()): UserEvent[] {
  const group = (e: UserEvent) => {
    if (eventKind(e) === "draft") return 1;
    const end = time(e.endDate ?? e.startDate);
    return end >= now ? 0 : 2;
  };
  const recency = (e: UserEvent) => time(e.startDate) || time(e.createdAt) || 0;
  return [...events].sort((a, b) => {
    const g = group(a) - group(b);
    if (g) return g;
    return group(a) === 0 ? time(a.startDate ?? a.endDate) - time(b.startDate ?? b.endDate) : recency(b) - recency(a);
  });
}

export function totals(events: UserEvent[]) {
  return events.reduce(
    (acc, e) => ({
      published: acc.published + (eventKind(e) === "published" ? 1 : 0),
      views: acc.views + (e.analytics?.views ?? 0),
      registrations: acc.registrations + (e.analytics?.registrations ?? 0),
    }),
    { published: 0, views: 0, registrations: 0 },
  );
}

/** Conversión inscritos/vistas, solo si hay vistas e inscritos reales. */
export function conversion(views?: number, registrations?: number): string | null {
  if (!views || !registrations || views <= 0) return null;
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format((registrations / views) * 100)} %`;
}
