import Link from "next/link";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MapPin, Clock, CalendarDays, ExternalLink, Star, Eye, Share2, TrendingUp, Sparkles, Globe, AlertTriangle } from "lucide-react";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { fetchPublicSiteDetail, fetchSiteLinkedEvents } from "@/presentation/sites/data/siteDetailFetchers";
import { getSiteOpenStatus } from "@/presentation/sites/lib/openStatus";
import { getHolidaysAction } from "@/app/actions/config/get-holidays.action";
import { OpeningPolicyNotes } from "./OpeningPolicyNotes";
import { HowToGetThere } from "./HowToGetThere";
import { SiteItineraryGrid } from "@/presentation/events/components/card/SiteItineraryCard";
import { SiteDetailActions } from "./SiteDetailActions";
import { SiteGalleryTrigger } from "./SiteGalleryModal";
import { SiteSocialShare } from "./SiteSocialShare";
import { ReportButton } from "@/presentation/shared/components/ReportButton";
import { SiteLocalBusinessJsonLd } from "../discovery/SiteJsonLd";
import { BookingButton } from "@/presentation/shared/components/BookingButton";
import { CATEGORY_ICON_MAP, CATEGORY_COLOR_MAP, CATEGORY_FALLBACK_COLOR } from "@/presentation/categories/lib/categoryIconMap";
import { cn } from "@/app/lib/utils/cn";
import { SITE_URL } from "@/app/lib/site";
import { getInitials } from "@/app/lib/utils/getInitials";
import { TrustBadge } from "../TrustBadge";
import { CompleteBadge } from "../CompleteBadge";
import { RecommendationsSection } from "./RecommendationsSection";
import { hasRecommendations } from "@/domain/entities/sites/value-objects/SiteRecommendations";
import { ConfirmBeforeGoingNotice } from "../ConfirmBeforeGoingNotice";
import { SiteClaimCta } from "../claim/SiteClaimCta";
import { SiteSuggestCta } from "../suggest/SiteSuggestCta";
import type { WeekDay, DaySchedule } from "@/presentation/sites/view-models/SiteFormViewModel";

const SITE_CATEGORY_LABELS: Record<string, string> = {
  restaurant: "Restaurante", cafe: "Cafetería", bar: "Bar",
  discotheque: "Discoteca", mall: "Centro comercial", park: "Parque",
  museum: "Museo", cultural: "Cultural", viewpoint: "Mirador",
  hostel: "Hostal", hotel: "Hotel", gym: "Gimnasio",
  spa: "Spa", theater: "Teatro", other: "Otro",
};

const WEEK_LABELS: Record<WeekDay, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
};

const WEEK_ORDER: WeekDay[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const brandIcon = (d: string) =>
  function BrandIcon({ className }: { className?: string }) {
    return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden><path d={d} /></svg>;
  };
const InstagramIcon = brandIcon("M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 00-2.13 1.38A5.88 5.88 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.88 5.88 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.13-1.38 5.88 5.88 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.13A5.88 5.88 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z");
const FacebookIcon = brandIcon("M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z");
const TikTokIcon = brandIcon("M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z");
const XIcon = brandIcon("M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z");

function isTrending(analytics: { likes?: number; eventCount?: number }): boolean {
  return (analytics.likes ?? 0) >= 3 || (analytics.eventCount ?? 0) >= 1;
}

interface SiteDetailContainerProps {
  siteId: string;
  initialLiked?: boolean;
}

export async function SiteDetailContainer({ siteId, initialLiked = false }: SiteDetailContainerProps) {
  const { siteInteractionService } = createServerContainer();
  const site = await fetchPublicSiteDetail(siteId);
  if (!site) notFound();

  let resolvedLiked = initialLiked;
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    const userId = tokens?.decodedToken?.uid;
    if (userId) {
      const liked = await siteInteractionService.findLikedByUser([siteId], userId);
      resolvedLiked = liked[siteId] ?? false;
    }
  } catch { /* no auth */ }

  const linkedEvents = await fetchSiteLinkedEvents(siteId);

  const { holidays } = await getHolidaysAction();
  const openStatus = getSiteOpenStatus(site.schedule, new Date(), { holidays, policy: site.openingPolicy });
  const trending = isTrending(site.analytics);

  const categoryLabel = SITE_CATEGORY_LABELS[site.category] ?? site.category;
  const categoryIconKey =
    site.category === "museum" ? "art"
    : site.category === "park" ? "nature"
    : site.category === "theater" ? "film"
    : site.category === "gym" ? "sports"
    : site.category === "spa" ? "health"
    : "food";
  const CatIcon = CATEGORY_ICON_MAP[categoryIconKey] ?? CATEGORY_ICON_MAP.food;
  const catColor = CATEGORY_COLOR_MAP[categoryIconKey] ?? CATEGORY_FALLBACK_COLOR;

  const media = site.mediaItems ?? [];

  // Coordenadas válidas: finitas, en rango y distintas de (0,0) (sitios sin geo real).
  const { latitude: lat, longitude: lng } = site.coordinates ?? {};
  const hasMap =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat!) <= 90 && Math.abs(lng!) <= 180 && !(lat === 0 && lng === 0);
  const mapsUrl = hasMap
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.address}, Ibagué`)}`;

  const social = site.socialMedia;
  const socialLinks = [
    { href: social?.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social?.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social?.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: social?.twitter, label: "X", Icon: XIcon },
    { href: social?.website, label: "Sitio web", Icon: Globe },
  ].filter((l): l is typeof l & { href: string } => Boolean(l.href));
  const hasLinks = Boolean(site.bookingUrl) || socialLinks.length > 0;

  const views = site.views ?? 0;
  const shares = site.analytics.shares ?? 0;
  const StatusIcon = trending ? TrendingUp : site.isNew ? Sparkles : Clock;
  const statusTitle = trending
    ? "Tendencia en Ibagué"
    : site.isNew
      ? "Recién llegado"
      : openStatus.isOpen ? "Abierto ahora" : "Cerrado ahora";
  const statusText = trending
    ? "Uno de los lugares favoritos de quienes visitan la ciudad."
    : site.isNew
      ? "Nuevo en la plataforma. Sé de los primeros en visitarlo."
      : openStatus.label ?? "Horario no disponible.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:max-w-4xl lg:max-w-6xl">
      <SiteLocalBusinessJsonLd site={site} />

      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/donde-ir" className="hover:underline">¿Dónde ir?</Link>
        <span>/</span>
        <span>{categoryLabel}</span>
        <span>/</span>
        <span className="truncate max-w-50 text-foreground font-medium">{site!.name}</span>
      </nav>

      {media.length > 0 && (
        <SiteGalleryTrigger media={media} siteName={site!.name} maxVisible={5} />
      )}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">{site!.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <TrustBadge site={site} withKind />
            <CompleteBadge site={site!} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", catColor.bg)}>
              <CatIcon className={cn("size-3.5", catColor.icon)} />
              <span className={catColor.icon}>{categoryLabel}</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {site!.address}
            </span>
            {site!.isNew && (
              <Badge variant="secondary" className="rounded-full text-xs">Nuevo</Badge>
            )}
          </div>
        </div>
        <SiteDetailActions
          siteId={siteId}
          siteName={site!.name}
          initialLiked={resolvedLiked}
          initialLikes={site!.analytics.likes ?? 0}
          initialShares={site!.analytics.shares ?? 0}
        />
      </div>

      <ConfirmBeforeGoingNotice site={site} className="mb-4" />
      <div className="mb-6 flex flex-col gap-2 empty:hidden sm:flex-row sm:flex-wrap">
        <SiteClaimCta site={site} />
        <SiteSuggestCta site={site} />
      </div>

      {site!.temporarilyClosed?.isClosed && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Cerrado temporalmente</p>
            {site!.temporarilyClosed.reason && (
              <p className="mt-0.5 text-xs text-amber-600">{site!.temporarilyClosed.reason}</p>
            )}
          </div>
        </div>
      )}

      {hasLinks && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {site!.bookingUrl && (
            <BookingButton url={site!.bookingUrl} disabled={site!.temporarilyClosed?.isClosed} />
          )}
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-medium text-[#52525B] transition-colors hover:border-[#09090B] hover:text-[#09090B]"
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </a>
          ))}
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-[#E4E4E7] px-4 py-3 sm:px-5">
        {/* basis 16rem: con flex-1 (basis 0) el texto nunca pasaba a otra línea y quedaba en una columna angosta */}
        <div className="flex min-w-0 flex-[1_1_16rem] items-center gap-3">
          <StatusIcon
            className={cn("size-5 shrink-0", trending ? "text-[#E63946]" : openStatus.isOpen ? "text-emerald-600" : "text-[#71717A]")}
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-sm text-[#52525B]">
            <span className="font-semibold text-[#09090B]">{statusTitle}.</span> {statusText}
          </p>
        </div>
        {(views > 0 || shares > 0) && (
          <p className="flex shrink-0 items-center gap-4 text-sm text-[#71717A] tabular-nums">
            {views > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye className="size-4" aria-hidden />
                {views.toLocaleString("es-CO")} vistas
              </span>
            )}
            {shares > 0 && (
              <span className="flex items-center gap-1.5">
                <Share2 className="size-4" aria-hidden />
                {shares.toLocaleString("es-CO")} compartidos
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">

        <div className="lg:col-span-2 space-y-10">
          {site!.description && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Sobre este lugar</h2>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{site!.description}</p>
            </section>
          )}

          <Separator />

          {hasRecommendations(site!.recommendations) && (
            <>
              <RecommendationsSection recommendations={site!.recommendations} />
              <Separator />
            </>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Publicado por</h2>
            <Link href={buildProfileHref({ id: site!.author.id })} className="flex items-center gap-4 group w-fit">
              <Avatar size="lg" className="size-12 border border-border">
                {site!.author.photoURL && <AvatarImage src={site!.author.photoURL} alt={site!.author.displayName} />}
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {getInitials(site!.author.displayName)}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold group-hover:underline">{site!.author.displayName}</p>
            </Link>
          </section>

          <Separator />

          <section>
            <h2 className="mb-2 text-lg font-semibold">¿Dónde estamos ubicados?</h2>
            <p className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              {site!.address}
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#09090B] underline decoration-[#E4E4E7] underline-offset-4 hover:decoration-[#09090B]"
            >
              <ExternalLink className="size-4" aria-hidden />
              Ver en Google Maps
            </a>

            {hasMap && <HowToGetThere destination={{ latitude: lat!, longitude: lng! }} />}

            {hasMap && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#F4F4F5]">
                {/* Mismo embed que el detalle de evento (EventPlace). */}
                <iframe
                  title={`Mapa de ${site!.name}`}
                  width="100%"
                  height="320"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                  className="block w-full border-0"
                />
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <Clock className="size-4 text-primary" /> Horario
            </h2>
            <div className={cn(
              "mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
              openStatus.isOpen
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground",
            )}>
              <span className={cn("size-2 rounded-full shrink-0", openStatus.isOpen ? "bg-green-500" : "bg-muted-foreground/50")} />
              {openStatus.label ?? "Horario no disponible"}
            </div>
            <div className="space-y-1">
              {WEEK_ORDER.map((day) => {
                const isToday = openStatus.todayKey === day;
                // Hoy festivo: la fila muestra el horario real de hoy (puede ser el de festivos).
                const sched: DaySchedule = isToday && openStatus.holiday
                  ? (() => { const [open = "", close = ""] = (openStatus.todayHours ?? "").split(" – "); return { open, close, closed: !openStatus.todayHours }; })()
                  : site!.schedule?.[day] ?? { open: "", close: "", closed: true };
                return (
                  <div key={day} className={cn("flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-sm", isToday && "bg-primary/5")}>
                    <span className={cn("font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                      {WEEK_LABELS[day]}{isToday && <span className="ml-1 text-xs">{openStatus.holiday ? "(hoy · festivo)" : "(hoy)"}</span>}
                    </span>
                    {sched.closed
                      ? <span className="text-xs text-muted-foreground/60">Cerrado</span>
                      : <span className="tabular-nums text-muted-foreground">{sched.open} – {sched.close}</span>
                    }
                  </div>
                );
              })}
            </div>
            <OpeningPolicyNotes policy={site!.openingPolicy} status={openStatus} className="mt-3" />
            <Separator className="my-4" />
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-amber-400 fill-amber-400" />
                <span>{(site!.analytics.likes ?? 0).toLocaleString("es-CO")} me gusta</span>
              </div>
              {(site!.analytics.eventCount ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  <span>{site!.analytics.eventCount} evento{site!.analytics.eventCount !== 1 ? "s" : ""} realizados</span>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <h2 className="mb-2 text-sm font-semibold text-[#09090B]">Compartir</h2>
            {/* El label en mayúsculas de SocialShareBar se oculta: el h2 lo reemplaza. */}
            <SiteSocialShare
              siteId={siteId}
              url={`${SITE_URL}/donde-ir/${site!.slug || siteId}`}
              title={site!.name}
              className="[&>p]:hidden"
            />
            <ReportButton targetType="site" targetId={siteId} authorId={site!.author.id} className="mt-4" />
          </div>
        </aside>
      </div>

      <>
        <Separator className="my-10" />
        <section>
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">Próximos eventos aquí</h2>
            <p className="mt-1 text-sm text-[#71717A]">Lo que se viene en {site!.name}</p>
          </div>
          <SiteItineraryGrid
            events={linkedEvents}
            emptyMessage="No hay eventos próximos en este lugar."
          />
        </section>
      </>
    </div>
  );
}
