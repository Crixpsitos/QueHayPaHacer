import Image from "next/image";
import Link from "next/link";
import { Award, BadgeCheck, CalendarDays, MapPin, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { siteCategoryLabel } from "@/presentation/sites/lib/constants";
import { EventStatusBadge } from "./EventStatusBadge";
import type {
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";

type EventPreview = NonNullable<UserEventInteraction["event"]>;

const formatEventDate = (date?: Date) =>
  date
    ? new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        day: "numeric",
        month: "short",
      }).format(new Date(date))
    : null;

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const ROW_CLASS =
  "group/card flex w-full min-w-0 items-start gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/35";

function Thumb({ src, alt, icon: Icon }: { src?: string; alt: string; icon: typeof MapPin }) {
  return (
    <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
      {src ? (
        <Image src={src} alt={alt} fill sizes="96px" className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Icon className="size-6 text-muted-foreground/50" aria-hidden />
        </div>
      )}
    </div>
  );
}

/** Estado real del evento para el autor: la moderación manda sobre `status`. */
const eventStatusKey = (event: UserEvent | EventPreview) =>
  "moderationStatus" in event && (event.moderationStatus === "rejected" || event.moderationStatus === "pending_audit")
    ? event.moderationStatus
    : event.status;

const siteStatusKey = (site: UserSite) =>
  site.moderationStatus === "rejected" ? "rejected" : site.moderationStatus === "approved" ? "published" : "pending";

export function TimelineEventCard({
  event,
  href,
  showAuthor = false,
  contributed = false,
}: {
  event: UserEvent | EventPreview;
  href: string;
  showAuthor?: boolean;
  contributed?: boolean;
}) {
  const date = formatEventDate(event.startDate);
  const place = event.location?.venue ?? event.location?.city;
  const status = contributed ? eventStatusKey(event) : undefined;

  return (
    <Link href={href} className={ROW_CLASS}>
      <Thumb src={event.image} alt={event.title} icon={CalendarDays} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover/card:text-primary">
          {event.title}
        </h4>

        {(event.category?.title || date || place) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {event.category?.title && <span>{event.category.title}</span>}
            {date && <span>{date}</span>}
            {place && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{place}</span>
              </span>
            )}
          </div>
        )}

        {status && <EventStatusBadge status={status} className="mt-0.5 self-start text-[11px]" />}

        {showAuthor && event.author && (
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={event.author.photoURL} alt="" />
              <AvatarFallback className="text-[9px]">
                {initials(event.author.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">{event.author.displayName}</span>
            {event.author.creatorVerified && (
              <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Creador verificado por QHPA" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function TimelineSiteCard({ site }: { site: UserSite }) {
  return (
    <Link href={`/donde-ir/${site.slug}`} className={ROW_CLASS}>
      <Thumb src={site.coverUrl} alt={site.name} icon={MapPin} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover/card:text-primary">
          {site.name}
        </h4>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {[site.category && siteCategoryLabel(site.category), site.address].filter(Boolean).join(" · ")}
        </p>
        <EventStatusBadge status={siteStatusKey(site)} className="mt-0.5 self-start text-[11px]" />
      </div>
    </Link>
  );
}

export function TimelineBadgeCard({ badge }: { badge: UserBadge }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold-dark">
        {badge.icon && badge.icon.length <= 4 ? (
          <span className="text-lg" aria-hidden>{badge.icon}</span>
        ) : (
          <Award className="size-5" aria-hidden />
        )}
      </span>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-foreground">{badge.name}</h4>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{badge.description}</p>
      </div>
    </div>
  );
}

export function MissingEventCard() {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
      <UserRound className="size-5 shrink-0" aria-hidden />
      El evento relacionado ya no está disponible.
    </div>
  );
}
