import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MapPin, Clock, CalendarDays, ExternalLink, Star, Eye, Share2, TrendingUp, Sparkles } from "lucide-react";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { EventCardInteractive } from "@/presentation/events/components/card/EventCardInteractive";
import { SiteDetailActions } from "./SiteDetailActions";
import { SiteGalleryTrigger } from "./SiteGalleryModal";
import { CATEGORY_ICON_MAP, CATEGORY_COLOR_MAP, CATEGORY_FALLBACK_COLOR } from "@/presentation/categories/lib/categoryIconMap";
import { cn } from "@/app/lib/utils/cn";
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

function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ── Indicador abierto/cerrado ────────────────────────────────────────────────
type DayKey = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
const DAY_MAP: DayKey[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function getOpenStatus(schedule: Record<string, { open: string; close: string; closed: boolean }> | undefined): { isOpen: boolean; label: string } {
  if (!schedule) return { isOpen: false, label: "Horario no disponible" };
  const now = new Date();
  const day = DAY_MAP[now.getDay()];
  const sched = schedule[day];
  if (!sched || sched.closed) return { isOpen: false, label: "Cerrado hoy" };
  const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
  const cur = now.getHours() * 60 + now.getMinutes();
  const isOpen = cur >= toMins(sched.open) && cur < toMins(sched.close);
  return {
    isOpen,
    label: isOpen ? `Abierto · Cierra a las ${sched.close}` : `Cerrado · Abre a las ${sched.open}`,
  };
}

// Sitio es "tendencia" si tiene >= 3 likes O >= 1 evento realizado (MVP)
function isTrending(analytics: { likes?: number; eventCount?: number }): boolean {
  return (analytics.likes ?? 0) >= 3 || (analytics.eventCount ?? 0) >= 1;
}

async function fetchLinkedEvents(siteId: string) {
  const { eventsService } = createServerContainer();
  const events = await eventsService.getEventsBySiteId(siteId, 8);
  return events.map((e) => EventViewModelMapper.toViewModel(e));
}

interface SiteDetailContainerProps {
  siteId: string;
  initialLiked?: boolean;
}

export async function SiteDetailContainer({ siteId, initialLiked = false }: SiteDetailContainerProps) {
  const { sitesService, siteInteractionService } = createServerContainer();
  const site = await sitesService.getSiteDetailById(siteId);
  if (!site) notFound();

  // Leer like real del usuario desde las cookies (SSR)
  let resolvedLiked = initialLiked;
  try {
    const tokens = await getTokens(await cookies(), authConfig);
    const userId = tokens?.decodedToken?.uid;
    if (userId) {
      const liked = await siteInteractionService.findLikedByUser([siteId], userId);
      resolvedLiked = liked[siteId] ?? false;
    }
  } catch { /* no cookies / no auth → resolvedLiked queda false */ }

  const linkedEvents = await fetchLinkedEvents(siteId);

  const openStatus = getOpenStatus(site.schedule as Record<string, { open: string; close: string; closed: boolean }>);
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

  const mapsUrl = site.coordinates
    ? `https://www.google.com/maps?q=${site.coordinates.latitude},${site.coordinates.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(site.address)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:max-w-6xl">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/donde-ir" className="hover:underline">¿Dónde ir?</Link>
        <span>/</span>
        <span>{categoryLabel}</span>
        <span>/</span>
        <span className="truncate max-w-50 text-foreground font-medium">{site!.name}</span>
      </nav>

      {/* ── Galería con modal ─────────────────────────────────────────────── */}
      {media.length > 0 && (
        <SiteGalleryTrigger media={media} siteName={site!.name} maxVisible={5} />
      )}

      {/* ── Título + acciones (debajo de la galería) ─────────────────────── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">{site!.name}</h1>
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
              <Badge variant="secondary" className="rounded-full text-xs">✨ Nuevo</Badge>
            )}
            {trending && !site!.isNew && (
              <Badge className="rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs border-0">
                🔥 Tendencia
              </Badge>
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

      {/* ── Banner de estadísticas (estilo Airbnb) ───────────────────────── */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border">
        <div className="flex min-h-18 items-stretch">

          {/* Izquierda: ícono + título corto (como "Favorito entre huéspedes") */}
          <div className="flex shrink-0 items-center gap-3 px-5 py-4">
            <div className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              trending
                ? "text-orange-500"
                : site!.isNew
                  ? "text-primary"
                  : openStatus.isOpen
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground",
            )}>
              {trending
                ? <TrendingUp className="size-6" strokeWidth={1.5} />
                : site!.isNew
                  ? <Sparkles className="size-6" strokeWidth={1.5} />
                  : openStatus.isOpen
                    ? <Clock className="size-6" strokeWidth={1.5} />
                    : <Clock className="size-6" strokeWidth={1.5} />
              }
            </div>
            <p className="whitespace-nowrap text-sm font-semibold leading-tight">
              {trending
                ? <>Tendencia<br /><span className="font-normal text-muted-foreground">en Ibagué</span></>
                : site!.isNew
                  ? <>Recién llegado<br /><span className="font-normal text-muted-foreground">a la ciudad</span></>
                  : openStatus.isOpen
                    ? <>Abierto ahora<br /><span className="font-normal text-muted-foreground">ver horario</span></>
                    : <>Cerrado ahora<br /><span className="font-normal text-muted-foreground">ver horario</span></>
              }
            </p>
          </div>

          {/* Separador */}
          <div className="w-px self-stretch bg-border" />

          {/* Centro: descripción (como "Según los huéspedes...") */}
          <div className="flex flex-1 items-center px-5 py-4">
            <p className="text-sm text-muted-foreground leading-snug">
              {trending
                ? "Uno de los lugares favoritos de los visitantes de Ibagué."
                : site!.isNew
                  ? "Nuevo en la plataforma. Sé de los primeros en visitarlo."
                  : openStatus.isOpen
                    ? `${openStatus.label}. ¡Buen momento para visitarlo!`
                    : `${openStatus.label}. Consulta el horario completo.`
              }
            </p>
          </div>

          {/* Derecha: métricas (números grandes con etiqueta, separados) */}
          {(site!.views ?? 0) > 0 && (
            <>
              <div className="w-px self-stretch bg-border" />
              <div className="flex shrink-0 flex-col items-center justify-center px-5 py-4 text-center">
                <span className="text-xl font-bold tabular-nums leading-none">
                  {(site!.views ?? 0).toLocaleString("es-CO")}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye className="size-3" />
                  vistas
                </span>
              </div>
            </>
          )}

          {(site!.analytics.shares ?? 0) > 0 && (
            <>
              <div className="w-px self-stretch bg-border" />
              <div className="flex shrink-0 flex-col items-center justify-center px-5 py-4 text-center">
                <span className="text-xl font-bold tabular-nums leading-none">
                  {(site!.analytics.shares ?? 0).toLocaleString("es-CO")}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Share2 className="size-3" />
                  compartidos
                </span>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Layout dos columnas ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-10">
          {site!.description && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Sobre este lugar</h2>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{site!.description}</p>
            </section>
          )}

          <Separator />

          {/* Autor */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Publicado por</h2>
            <Link href={`/profile/${site!.author.displayName}`} className="flex items-center gap-4 group w-fit">
              <Avatar size="lg" className="size-12 border border-border">
                {site!.author.photoURL && <AvatarImage src={site!.author.photoURL} alt={site!.author.displayName} />}
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {getInitials(site!.author.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold group-hover:underline">@{site!.author.displayName}</p>
                <p className="text-sm text-muted-foreground">{categoryLabel}</p>
              </div>
            </Link>
          </section>

          <Separator />

          {/* Mapa */}
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
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-4" />
              Ver en Google Maps
            </a>

            {/* Mapa embebido */}
            {site!.coordinates && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <iframe
                  title="Ubicación del sitio"
                  width="100%"
                  height="320"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${site!.coordinates.latitude},${site!.coordinates.longitude}&z=16&output=embed`}
                  className="block w-full border-0"
                />
              </div>
            )}
          </section>
        </div>

        {/* Columna derecha — Horario */}
        <aside>
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <Clock className="size-4 text-primary" /> Horario
            </h2>
            {/* Indicador abierto/cerrado — aquí es más contextual que en el título */}
            <div className={cn(
              "mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
              openStatus.isOpen
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground",
            )}>
              <span className={cn("size-2 rounded-full shrink-0", openStatus.isOpen ? "bg-green-500" : "bg-muted-foreground/50")} />
              {openStatus.label}
            </div>
            <div className="space-y-1">
              {WEEK_ORDER.map((day) => {
                const sched: DaySchedule = site!.schedule?.[day] ?? { open: "", close: "", closed: true };
                const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
                const isToday = todayName === day;
                return (
                  <div key={day} className={cn("flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-sm", isToday && "bg-primary/5")}>
                    <span className={cn("font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                      {WEEK_LABELS[day]}{isToday && <span className="ml-1 text-xs">(hoy)</span>}
                    </span>
                    {sched.closed
                      ? <span className="text-xs text-muted-foreground/60">Cerrado</span>
                      : <span className="tabular-nums text-muted-foreground">{sched.open} – {sched.close}</span>
                    }
                  </div>
                );
              })}
            </div>
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
          </div>
        </aside>
      </div>

      {/* ── Itinerario ────────────────────────────────────────────────────── */}
      {linkedEvents.length > 0 && (
        <>
          <Separator className="my-10" />
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Itinerario del sitio</h2>
                  <p className="text-sm text-muted-foreground">Eventos que se realizan en {site!.name}</p>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full">
                {linkedEvents.length} evento{linkedEvents.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <EventCardInteractive
              events={linkedEvents}
              info={{ title: "Sin eventos programados", description: "Todavía no hay eventos en este lugar." }}
              variant="vertical"
              columns={3}
            />
          </section>
        </>
      )}
    </div>
  );
}
