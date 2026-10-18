import type {
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";

export type ProfileTimelineItem =
  | { id: string; type: "event"; date: Date; event: UserEvent }
  | { id: string; type: "site"; date: Date; site: UserSite }
  | { id: string; type: "like"; date: Date; interaction: UserEventInteraction }
  | { id: string; type: "badge"; date: Date; badge: UserBadge };

export interface ProfileTimelineDateGroup {
  dateKey: string;
  date: Date;
  items: ProfileTimelineItem[];
}

interface ProfileTimelineData {
  events: UserEvent[];
  sites: UserSite[];
  likes: UserEventInteraction[];
  badges: UserBadge[];
}

export function buildProfileTimelineItems(data: ProfileTimelineData): ProfileTimelineItem[] {
  return [
    ...data.events
      .filter((event) => event.status !== "draft")
      .map((event): ProfileTimelineItem => ({
        id: `event-${event.id}`,
        type: "event",
        date: new Date(event.createdAt),
        event,
      })),
    ...data.sites
      .filter((site) => site.publicationStatus !== "draft")
      .map((site): ProfileTimelineItem => ({
        id: `site-${site.id}`,
        type: "site",
        date: new Date(site.createdAt),
        site,
      })),
    ...data.likes
      .filter((interaction) => interaction.type === "like")
      .map((interaction): ProfileTimelineItem => ({
        id: `like-${interaction.id}`,
        type: "like",
        date: new Date(interaction.createdAt),
        interaction,
      })),
    ...data.badges.map((badge): ProfileTimelineItem => ({
      id: `badge-${badge.id}`,
      type: "badge",
      date: new Date(badge.earnedAt),
      badge,
    })),
  ].sort((first, second) => second.date.getTime() - first.date.getTime());
}

const calendarDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getCalendarDateKey(date: Date): string {
  const parts = calendarDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function groupProfileTimelineItems(
  items: ProfileTimelineItem[],
): ProfileTimelineDateGroup[] {
  const groups = new Map<string, ProfileTimelineDateGroup>();

  for (const item of items) {
    const dateKey = getCalendarDateKey(item.date);
    const group = groups.get(dateKey);

    if (group) {
      group.items.push(item);
    } else {
      groups.set(dateKey, { dateKey, date: item.date, items: [item] });
    }
  }

  return [...groups.values()];
}
