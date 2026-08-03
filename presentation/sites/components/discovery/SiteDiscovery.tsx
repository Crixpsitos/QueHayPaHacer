"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  CalendarDays,
  Heart,
  Share2,
  Clock,
  Flame,
  Coffee,
  UtensilsCrossed,
  Beer,
  Music2,
  ShoppingBag,
  Trees,
  Landmark,
  Theater,
  Mountain,
  BedDouble,
  Building2,
  Dumbbell,
  Sparkles,
  MapPinned,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { getInitials } from "@/app/lib/utils/getInitials";
import { SiteLocalBusinessJsonLd, SiteItemListJsonLd } from "./SiteJsonLd";
import { recordSiteInteractionAction } from "@/app/actions/sites/record-site-interaction.action";
import type { SiteDetail, SiteSchedule, WeekDay } from "../../view-models/SiteFormViewModel";
import { cn } from "@/app/lib/utils/cn";

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { label: string; Icon: React.ElementType; color: string }
> = {
  restaurant:  { label: "Restaurante",       Icon: UtensilsCrossed, color: "text-orange-500" },
  cafe:        { label: "Café",              Icon: Coffee,          color: "text-amber-600"  },
  bar:         { label: "Bar",               Icon: Beer,            color: "text-yellow-500" },
  discotheque: { label: "Discoteca",         Icon: Music2,          color: "text-purple-500" },
  mall:        { label: "Centro comercial",  Icon: ShoppingBag,     color: "text-pink-500"   },
  park:        { label: "Parque",            Icon: Trees,           color: "text-green-600"  },
  museum:      { label: "Museo",             Icon: Landmark,        color: "text-blue-600"   },
  cultural:    { label: "Cultural",          Icon: Theater,         color: "text-indigo-500" },
  viewpoint:   { label: "Mirador",           Icon: Mountain,        color: "text-teal-500"   },
  hostel:      { label: "Hostal",            Icon: BedDouble,       color: "text-cyan-600"   },
  hotel:       { label: "Hotel",             Icon: Building2,       color: "text-sky-600"    },
  gym:         { label: "Gimnasio",          Icon: Dumbbell,        color: "text-red-500"    },
  spa:         { label: "Spa",               Icon: Sparkles,        color: "text-rose-400"   },
  theater:     { label: "Teatro",            Icon: Theater,         color: "text-violet-500" },
  other:       { label: "Otro",              Icon: MapPinned,       color: "text-zinc-500"   },
};

// ─── Open/closed logic ───────────────────────────────────────────────────────

const DAY_KEYS: WeekDay[] = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];

const DAY_SHORT: Record<WeekDay, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

function getOpenStatus(schedule: SiteSchedule | null | undefined) {
  if (!schedule) return { isOpen: false, label: null, todayHours: null };

  const now = new Date();
  const todayKey = DAY_KEYS[now.getDay()];
  const todaySchedule = schedule[todayKey];

  if (!todaySchedule || todaySchedule.closed) {
    return { isOpen: false, label: `Cerrado hoy (${DAY_SHORT[todayKey]})`, todayHours: null };
  }

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m ?? 0);
  };

  const current = now.getHours() * 60 + now.getMinutes();
  const openMin = toMinutes(todaySchedule.open);
  const closeMin = toMinutes(todaySchedule.close);
  const isOpen = current >= openMin && current < closeMin;
  const todayHours = `${todaySchedule.open} – ${todaySchedule.close}`;

  return {
    isOpen,
    label: isOpen
      ? `Abierto · Cierra ${todaySchedule.close}`
      : `Cerrado · Abre ${todaySchedule.open}`,
    todayHours,
  };
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function SiteDiscoveryCard({
  site,
  initialLiked = false,
  isLikesLoading = false,
  prioritize = false,
  isTrending = false,
}: {
  site: SiteDetail;
  initialLiked?: boolean;
  isLikesLoading?: boolean;
  prioritize?: boolean;
  isTrending?: boolean;
}) {
  const cat = CATEGORY_CONFIG[site.category] ?? CATEGORY_CONFIG.other;

  // Open/closed computed client-side after mount (new Date() not allowed during prerender)
  const [openStatus, setOpenStatus] = useState<ReturnType<typeof getOpenStatus> | null>(null);
  useEffect(() => {
    setOpenStatus(getOpenStatus(site.schedule));
  }, [site.schedule]);

  const isOpen = openStatus?.isOpen ?? false;
  const statusLabel = openStatus?.label ?? null;

  const [likes, setLikes] = useState(site.analytics?.likes ?? 0);
  const [liked, setLiked] = useState(initialLiked);
  const [shared, setShared] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Sync when parent resolves the server-side liked state after mount
  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (likeLoading) return;
      setAuthError(false);
      const next = !liked;
      // Optimistic update
      setLiked(next);
      setLikes((n) => n + (next ? 1 : -1));
      setLikeLoading(true);
      const result = await recordSiteInteractionAction(site.id, next ? "like" : "unlike");
      if (!result.success) {
        // Revert on failure
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
        if (result.authRequired) setAuthError(true);
      }
      setLikeLoading(false);
    },
    [liked, likeLoading, site.id],
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/donde-ir/${site.slug || site.id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: site.name, url });
        } else {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        // User cancelled share dialog — do nothing
        return;
      }
      setShared(true);
      void recordSiteInteractionAction(site.id, "share");
      // Auto-reset after 2s so the user can share again
      setTimeout(() => setShared(false), 2000);
    },
    [site.id, site.name],
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <SiteLocalBusinessJsonLd site={site} />

      {/* Image + status overlay */}
      <Link href={`/donde-ir/${site.slug || site.id}`} className="block relative aspect-4/3 w-full overflow-hidden bg-muted">
        {site.coverUrl ? (
          <Image
            src={site.coverUrl}
            alt={site.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            priority={prioritize}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <cat.Icon className={cn("size-12 opacity-20", cat.color)} aria-hidden="true" />
          </div>
        )}

        {/* Trending + New badges (top-right) */}
        {(isTrending || site.isNew) && (
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
            {isTrending && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow backdrop-blur-sm">
                <Flame className="size-3.5" aria-hidden="true" />
                Tendencia
              </span>
            )}
            {site.isNew && (
              <span className="flex items-center gap-1 rounded-full bg-sky-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow backdrop-blur-sm">
                ✨ Nuevo
              </span>
            )}
          </div>
        )}

        {/* Open / closed badge (top-left) */}
        {openStatus === null ? (
          <span
            className="absolute left-3 top-3 h-6.5 w-32 animate-pulse rounded-full bg-zinc-300/70 dark:bg-zinc-700/70 backdrop-blur-sm"
            aria-hidden="true"
          />
        ) : statusLabel ? (
          <span
            className={cn(
              "absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow backdrop-blur-sm transition-opacity duration-200 opacity-100",
              isOpen ? "bg-emerald-500/90 text-white" : "bg-zinc-800/80 text-zinc-200",
            )}
          >
            {isOpen ? (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
              <XCircle className="size-3.5" aria-hidden="true" />
            )}
            {statusLabel}
          </span>
        ) : null}
      </Link>

      {/* Body */}
      <Link href={`/donde-ir/${site.slug || site.id}`} className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-2">
        {/* Category chip */}
        <span className={cn("flex w-fit items-center gap-1 text-xs font-medium", cat.color)}>
          <cat.Icon className="size-3.5" aria-hidden="true" />
          {cat.label}
        </span>

        {/* Name */}
        <h3 className="font-semibold leading-snug group-hover:underline line-clamp-2">
          {site.name}
        </h3>

        {/* Address */}
        {site.address && (
          <p className="flex items-start gap-1 text-sm text-muted-foreground line-clamp-1">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {site.address}
          </p>
        )}

        {/* Today's hours — min-h reservado, fade-in para evitar CLS */}
        <p className={cn(
          "flex h-4 items-center gap-1 text-xs text-muted-foreground transition-opacity duration-300",
          openStatus?.todayHours ? "opacity-100" : "opacity-0",
        )}>
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          {openStatus?.todayHours ? `Hoy: ${openStatus.todayHours}` : "\u00a0"}
        </p>

        {/* Event count */}
        {(site.analytics?.eventCount ?? 0) > 0 && (
          <p className="flex items-center gap-1 text-xs text-primary font-medium">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {site.analytics.eventCount}{" "}
            {site.analytics.eventCount === 1 ? "evento" : "eventos"}
          </p>
        )}
      </Link>

      {/* Footer: author + like + share */}
      <div className="flex flex-col border-t border-border px-4 py-2.5 gap-1.5">
        {/* Author */}
        {'author' in site && site.author && (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {site.author.photoURL && (
                <AvatarImage src={site.author.photoURL} alt={site.author.displayName} />
              )}
              <AvatarFallback className="text-[10px]">
                {getInitials(site.author.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              @{site.author.displayName}
            </span>
          </div>
        )}
        {authError && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Inicia sesión para dar me gusta.
          </p>
        )}
        <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">
          {likes > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="size-3.5 fill-rose-400 text-rose-400" aria-hidden="true" />
              {likes.toLocaleString("es-CO")}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            disabled={likeLoading || isLikesLoading}
            aria-label={liked ? "Quitar me gusta" : "Me gusta"}
            aria-pressed={liked}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              isLikesLoading
                ? "text-muted-foreground animate-pulse cursor-wait"
                : liked
            )}
          >
          {likeLoading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Heart
                className={cn("size-3.5 transition-all", liked && "fill-current scale-110")}
                aria-hidden="true"
              />
            )}
            {liked ? "Te gustó" : "Me gusta"}
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Compartir sitio"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              shared
                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Share2 className="size-3.5" aria-hidden="true" />
            {shared ? "¡Copiado!" : "Compartir"}
          </button>
        </div>
        </div>
      </div>
    </article>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

const EMPTY = (
  <div className="py-16 text-center">
    <h3 className="text-xl font-semibold text-foreground">Todavía no hay lugares aquí</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Estamos sumando sitios constantemente. Vuelve pronto para descubrir dónde ir.
    </p>
  </div>
);

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function SiteDiscoveryGrid({
  sites,
  showTrending = false,
}: {
  sites: SiteDetail[];
  showTrending?: boolean;
}) {
  const [likedBysite, setLikedBySite] = useState<Record<string, boolean>>({});
  // Inicia en false para evitar hydration mismatch (disabled SSR vs cliente)
  const [isLikesLoading, setIsLikesLoading] = useState(false);

  useEffect(() => {
    const ids = sites.map((s) => s.id);
    if (ids.length === 0) return;
    setIsLikesLoading(true);
    fetch(`/api/sites/likes?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((likes: Record<string, boolean>) => {
        setLikedBySite(likes);
        setIsLikesLoading(false);
      })
      .catch(() => setIsLikesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites.map((s) => s.id).join(",")]);

  if (sites.length === 0) return EMPTY;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <SiteItemListJsonLd sites={sites} />
      {sites.map((s, index) => (
        <SiteDiscoveryCard
          key={s.id}
          site={s}
          initialLiked={likedBysite[s.id] ?? false}
          isLikesLoading={isLikesLoading}
          prioritize={index < 4}
          isTrending={showTrending && index < 4}
        />
      ))}
    </div>
  );
}

