"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Activity, MapPin, Heart, Award, Eye, Share2, Users, Zap, Calendar, TrendingUp, BarChart3, Sparkles, Trophy, Milestone, Pencil, LayoutDashboard, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { siteCategoryLabel } from "@/presentation/sites/lib/constants";
import type {
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";
import { EventStatusBadge } from "./EventStatusBadge";
import { EventAttendeesDialog } from "@/presentation/events/components/EventAttendeesDialog";

interface ProfileTabsProps {
  uid: string;
  fetchUserEvents: (uid: string) => Promise<UserEvent[]>;
  fetchUserSites: (uid: string) => Promise<UserSite[]>;
  /** Si se omite, la pestaña de Likes no se muestra ni se solicita al backend (perfil público). */
  fetchUserLikes?: (uid: string) => Promise<UserEventInteraction[]>;
  fetchUserBadges: (uid: string) => Promise<UserBadge[]>;
  /** Habilita acciones de gestión (editar) sobre los eventos. Solo en el perfil propio. */
  canEdit?: boolean;
  /** Muestra el acceso al Estudio del Organizador. Solo dueño + cuenta profesional. */
  showStudioLink?: boolean;
}

function ProfileTabsInner({
  uid,
  fetchUserEvents,
  fetchUserSites,
  fetchUserLikes,
  fetchUserBadges,
  canEdit = false,
  showStudioLink = false,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("events");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [sites, setSites] = useState<UserSite[]>([]);
  const [likes, setLikes] = useState<UserEventInteraction[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const hasLikesTab = Boolean(fetchUserLikes);

  // SINGLE useEffect - se dispara solo cuando uid cambia
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      console.log(`[ProfileTabs] Cargando datos para uid: ${uid}`);
      setIsLoading(true);
      setLoadError(null);
      try {
        const [eventsData, sitesData, likesData, badgesData] = await Promise.all([
          fetchUserEvents(uid),
          fetchUserSites(uid),
          fetchUserLikes ? fetchUserLikes(uid) : Promise.resolve<UserEventInteraction[]>([]),
          fetchUserBadges(uid),
        ]);

        if (!mounted) return;
        console.log(`[ProfileTabs] ✅ Datos cargados exitosamente`);
        setEvents(eventsData);
        setSites(sitesData);
        setLikes(likesData);
        setBadges(badgesData);
      } catch (error) {
        if (!mounted) return;
        console.error("Error loading profile data:", error);
        setLoadError("No pudimos cargar la informacion del perfil. Intenta nuevamente.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [uid, fetchUserEvents, fetchUserSites, fetchUserLikes, fetchUserBadges]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
    }).format(new Date(date));

  const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));

  const getEventTimeState = (startDate?: Date, endDate?: Date, status?: string) => {
    const now = Date.now();
    const normalizedStatus = status?.toLowerCase();
    const startMs = startDate ? new Date(startDate).getTime() : undefined;
    const endMs = endDate ? new Date(endDate).getTime() : undefined;

    if (normalizedStatus === "cancelled") {
      return {
        label: "Cancelado",
        className:
          "border-red-300 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300",
        isExpired: true,
      };
    }

    if (normalizedStatus === "ended") {
      return {
        label: "Expirado",
        className:
          "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300",
        isExpired: true,
      };
    }

    if (typeof endMs === "number" && now > endMs) {
      return {
        label: "Expirado",
        className:
          "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300",
        isExpired: true,
      };
    }

    if (typeof startMs === "number" && now < startMs) {
      return {
        label: "Proximo",
        className:
          "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-900 dark:bg-sky-900/30 dark:text-sky-300",
        isExpired: false,
      };
    }

    if (
      typeof startMs === "number" &&
      typeof endMs === "number" &&
      now >= startMs &&
      now <= endMs
    ) {
      return {
        label: "En curso",
        className:
          "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300",
        isExpired: false,
      };
    }

    if (typeof startMs === "number" && now >= startMs) {
      return {
        label: "Iniciado",
        className:
          "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
        isExpired: false,
      };
    }

    return {
      label: "Fecha pendiente",
      className: "border-border bg-muted text-muted-foreground",
      isExpired: false,
    };
  };

  const getPriceLabel = (input: {
    isFree?: boolean;
    priceAmount?: number;
    priceCurrency?: string;
  }): string => {
    if (input.isFree) {
      return "Gratis";
    }

    if (typeof input.priceAmount === "number") {
      return `${input.priceAmount.toLocaleString("es-CO")} ${input.priceCurrency ?? "COP"}`;
    }

    return "Sin precio";
  };

  const formatCompactNumber = (value: number): string =>
    new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(value);

  const EmptyState = ({ text }: { text: string }) => (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
      {text}
    </div>
  );

  // Variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        delayChildren: 0,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 sm:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${hasLikesTab ? "grid-cols-4" : "grid-cols-3"}`}>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="sites" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Sitios</span>
          </TabsTrigger>
          {hasLikesTab && (
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Likes</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Insignias</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="events-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                Cargando eventos...
              </motion.div>
            ) : loadError ? (
              <motion.div
                key="events-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState text={loadError} />
              </motion.div>
            ) : events.length === 0 ? (
              <motion.div
                key="events-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState text="Aún no has creado eventos." />
              </motion.div>
            ) : (
              <motion.div
                key="events-content"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {events.map((event) => (
                  (() => {
                    const eventTimeState = getEventTimeState(
                      event.startDate,
                      event.endDate,
                      event.status,
                    );
                    const views = event.analytics?.views ?? 0;
                    const likesCount = event.analytics?.likes ?? 0;
                    const clicks = event.analytics?.clicks ?? 0;
                    const registrations = event.analytics?.registrations ?? 0;
                    const shares = event.analytics?.shares ?? 0;
                    const isMultiDate = event.eventType === "multi-date";
                    // Multi-date: registros y capacity viven en sesiones, no en el evento padre
                    const interactions = isMultiDate
                      ? likesCount + shares
                      : likesCount + clicks + registrations + shares;
                    const engagement = views > 0 ? Math.min(100, (interactions / views) * 100) : 0;
                    const occupancy =
                      !isMultiDate && typeof event.capacity === "number" && event.capacity > 0
                        ? Math.min(100, (registrations / event.capacity) * 100)
                        : undefined;

                    return (
                      <motion.article
                        key={event.id}
                        variants={itemVariants}
                        className="group overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-xl"
                      >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {event.image ? (
                      <>
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"></div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${eventTimeState.className}`}
                      >
                        {eventTimeState.label}
                      </span>
                      {event.eventType === "multi-date" && (
                        <span className="inline-flex items-center rounded-full border border-purple-400/60 bg-purple-500/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          Varias fechas
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <EventStatusBadge status={event.status} />
                      </div>
                      <div className="rounded-lg bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                        Publicado: {formatDate(event.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 p-4">
                    <div>
                      <p className="line-clamp-2 text-[15px] font-semibold leading-tight text-foreground">{event.title}</p>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{event.eventType === "multi-date" ? "Rango de fechas" : "Agenda del evento"}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                        {event.startDate && (
                          <div className="flex items-center justify-between gap-2">
                            <span>{event.eventType === "multi-date" ? "Desde" : "Inicio"}</span>
                            <span className="font-medium text-foreground/80">{formatDateTime(event.startDate)}</span>
                          </div>
                        )}
                        {event.endDate && (
                          <div className="flex items-center justify-between gap-2">
                            <span>{event.eventType === "multi-date" ? "Hasta" : "Fin"}</span>
                            <span className="font-medium text-foreground/80">{formatDateTime(event.endDate)}</span>
                          </div>
                        )}
                        {event.eventType === "multi-date" && !event.startDate && (
                          <p className="text-muted-foreground/60">Fechas por confirmar en sesiones</p>
                        )}
                      </div>
                    </div>

                    {event.eventType !== "multi-date" && (
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-border/60 bg-background p-3 text-xs text-muted-foreground">
                      {event.location?.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {event.location.venue}
                            {event.location.city ? ` · ${event.location.city}` : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">{getPriceLabel(event)}</span>
                        {typeof event.capacity === "number" && event.capacity > 0 && (
                          <span>Capacidad: {event.capacity.toLocaleString("es-CO")}</span>
                        )}
                      </div>
                    </div>
                    )}
                    {event.eventType === "multi-date" && (
                    <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300">
                      <Sparkles className="size-3.5 shrink-0" />
                      <span>Precio y ubicación varían por sesión. <Link href={`/eventos/${event.id}`} className="underline">Ver sesiones</Link></span>
                    </div>
                    )}

                    <div className="rounded-xl border border-border/60 bg-background p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/75">
                          <BarChart3 className="h-3.5 w-3.5" />
                          Rendimiento
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="h-3 w-3" />
                          {engagement.toFixed(1)}% engagement
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-muted/40 p-2">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            Vistas
                          </div>
                          <p className="mt-1 text-sm font-semibold text-foreground">{formatCompactNumber(views)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Heart className="h-3.5 w-3.5" />
                            Likes
                          </div>
                          <p className="mt-1 text-sm font-semibold text-foreground">{formatCompactNumber(likesCount)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-2">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            {isMultiDate ? <Share2 className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                            {isMultiDate ? "Compartidos" : "Registros"}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-foreground">{formatCompactNumber(isMultiDate ? shares : registrations)}</p>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          {/* "Clicks" solo tiene sentido en eventos con registro externo */}
                          {!isMultiDate && event.registrationType === "external" && (
                            <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" />Clicks: {formatCompactNumber(clicks)}</span>
                          )}
                          {!isMultiDate && (
                          <span className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" />Compartidos: {formatCompactNumber(shares)}</span>
                          )}
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-foreground/70"
                            style={{ width: `${Math.max(6, engagement)}%` }}
                          />
                        </div>
                      </div>

                      {typeof occupancy === "number" && (
                        <div className="mt-2 border-t border-border/50 pt-2">
                          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Ocupacion estimada</span>
                            <span>{occupancy.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${Math.max(4, occupancy)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex gap-2">
                        {event.status?.toLowerCase() === "published" && (
                          <Link
                            href={`/eventos/${event.id}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                            aria-label={`Ver evento: ${event.title}`}
                          >
                            <Eye className="h-4 w-4" />
                            Ver evento
                          </Link>
                        )}
                        <Link
                          href={`/eventos/${event.id}/edit`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-violet/40 bg-brand-violet/5 px-3 py-2 text-sm font-semibold text-brand-violet transition-colors hover:bg-brand-violet/10"
                          aria-label={`Editar evento: ${event.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar evento
                        </Link>
                        {showStudioLink ? (
                          <Link
                            href={`/studio/events/${event.id}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                            aria-label={`Ir al Estudio del evento: ${event.title}`}
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Ir a estudio
                          </Link>
                        ) : (
                          (event.registrationType === "internal" || event.registrationType === "form") &&
                          event.status?.toLowerCase() === "published" && (
                            <EventAttendeesDialog
                              eventId={event.id}
                              eventTitle={event.title}
                              trigger={
                                <button
                                  type="button"
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                                  aria-label={`Ver inscritos del evento: ${event.title}`}
                                >
                                  <Users className="h-4 w-4" />
                                  Ver inscritos
                                </button>
                              }
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </motion.article>
                    );
                  })()
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="sites" className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="sites-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                Cargando sitios...
              </motion.div>
            ) : sites.length === 0 ? (
              <motion.div
                key="sites-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState text="Aún no has agregado sitios." />
              </motion.div>
            ) : (
              <motion.div
                key="sites-content"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {sites.map((site) => (
                  <motion.article
                    key={site.id}
                    variants={itemVariants}
                    className="group overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-xl"
                  >
                    {/* Cover image */}
                    <Link href={`/donde-ir/${site.slug || site.id}`} className="block">
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        {site.coverUrl ? (
                          <>
                            <Image
                              src={site.coverUrl}
                              alt={site.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <Building2 className="size-10" />
                          </div>
                        )}
                        {/* Categoría */}
                        <div className="absolute left-3 top-3">
                          <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                            {siteCategoryLabel(site.category) || "Sitio"}
                          </span>
                        </div>
                        {/* Estado publicación */}
                        <div className="absolute right-3 top-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${
                            site.publicationStatus === "published" && site.moderationStatus === "approved"
                              ? "bg-emerald-500/80 text-white"
                              : site.moderationStatus === "rejected"
                                ? "bg-red-500/80 text-white"
                                : "bg-amber-500/80 text-white"
                          }`}>
                            {site.publicationStatus === "draft"
                              ? "Borrador"
                              : site.moderationStatus === "approved"
                                ? "Publicado"
                                : site.moderationStatus === "rejected"
                                  ? "Rechazado"
                                  : "En revisión"}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="space-y-3 p-4">
                      <div>
                        <Link href={`/donde-ir/${site.slug || site.id}`}>
                          <p className="line-clamp-1 text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">{site.name}</p>
                        </Link>
                        {site.address && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{site.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Analytics */}
                      <div className="rounded-xl border border-border/60 bg-background p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/75">
                            <BarChart3 className="size-3.5" />
                            Rendimiento
                          </div>
                          {(() => {
                            const siteViews = site.analytics.views;
                            const siteLikes = site.analytics.likes;
                            const siteEngagement = siteViews > 0 ? Math.min(100, (siteLikes / siteViews) * 100) : 0;
                            return (
                              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="size-3" />
                                {siteEngagement.toFixed(1)}% engagement
                              </div>
                            );
                          })()}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-muted/40 p-2">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Eye className="size-3.5" />Vistas</div>
                            <p className="mt-1 text-sm font-semibold text-foreground">{formatCompactNumber(site.analytics.views)}</p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Heart className="size-3.5" />Likes</div>
                            <p className="mt-1 text-sm font-semibold text-foreground">{formatCompactNumber(site.analytics.likes)}</p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Calendar className="size-3.5" />Eventos</div>
                            <p className="mt-1 text-sm font-semibold text-foreground">{site.analytics.eventCount}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-foreground/70" style={{ width: `${Math.max(4, site.analytics.views > 0 ? Math.min(100, (site.analytics.likes / site.analytics.views) * 100) : 0)}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      {canEdit && (
                        <div className="flex gap-2">
                          {site.publicationStatus === "published" && site.moderationStatus === "approved" && (
                            <Link
                              href={`/donde-ir/${site.slug || site.id}`}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                            >
                              <Eye className="size-4" /> Ver sitio
                            </Link>
                          )}
                          <Link
                            href={`/sites/${site.id}/edit`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-violet/40 bg-brand-violet/5 px-3 py-2 text-sm font-semibold text-brand-violet transition-colors hover:bg-brand-violet/10"
                          >
                            <Pencil className="size-4" /> Editar
                          </Link>
                          {showStudioLink && (
                            <Link
                              href={`/studio/sites/${site.id}`}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                            >
                              <LayoutDashboard className="size-4" /> Estudio
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {hasLikesTab && (
        <TabsContent value="likes" className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="likes-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-muted-foreground"
              >
                Cargando likes...
              </motion.div>
            ) : likes.length === 0 ? (
              <motion.div
                key="likes-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState text="Aún no hay likes para mostrar." />
              </motion.div>
            ) : (
              <motion.div
                key="likes-content"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {likes.map((like, index) => (
                  (() => {
                    const eventTimeState = getEventTimeState(
                      like.event?.startDate,
                      like.event?.endDate,
                      like.event?.status,
                    );
                    return (
                      <motion.article
                        key={`${like.id || like.eventId || "like"}-${like.createdAt?.toString?.() ?? "no-date"}-${index}`}
                        variants={itemVariants}
                        className="group overflow-hidden rounded-xl border border-border/50 bg-background shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                      >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {like.event?.image ? (
                      <>
                        <Image
                          src={like.event.image}
                          alt={like.event?.title ?? `Evento ${like.eventId}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"></div>
                        <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/90 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                          <Heart className="h-5 w-5 fill-white text-white" />
                        </div>
                        <div
                          className={`absolute left-3 top-3 rounded-full border px-2 py-0.5 text-xs font-semibold ${eventTimeState.className}`}
                        >
                          {eventTimeState.label}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 p-4">
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${eventTimeState.className}`}
                      >
                        Estado: {eventTimeState.label}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-base font-bold leading-tight text-foreground">
                      {like.event?.title ?? `Evento ${like.eventId}`}
                    </p>
                    {like.event?.startDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Inicio: {formatDateTime(like.event.startDate)}</span>
                      </div>
                    )}
                    {like.event?.endDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Fin: {formatDateTime(like.event.endDate)}</span>
                      </div>
                    )}
                    {like.event?.location?.venue && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {like.event.location.venue}
                          {like.event.location.city ? ` · ${like.event.location.city}` : ""}
                        </span>
                      </div>
                    )}
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5" />
                          <span>{like.event?.analytics?.likes ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{like.event?.analytics?.views ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{like.event?.analytics?.registrations ?? 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                        <Heart className="h-3 w-3" /> Te gusta
                      </span>
                      {like.event && (
                        <span className="text-xs font-medium text-foreground">
                          {getPriceLabel(like.event)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(like.createdAt)}</span>
                    </div>
                  </div>
                </motion.article>
                    );
                  })()
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
        )}

        <TabsContent value="badges" className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="badges-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-muted-foreground"
              >
                Cargando insignias...
              </motion.div>
            ) : badges.length === 0 ? (
              <motion.div
                key="badges-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState text="Aún no tienes insignias. ¡Empieza a participar en la comunidad!" />
              </motion.div>
            ) : (
              <motion.div
                key="badges-content"
                className="space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Del Sistema */}
                {badges.filter((b) => b.category === "system").length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Insignias del Sistema</h3>
                        <p className="text-xs text-muted-foreground">Otorgadas automáticamente</p>
                      </div>
                    </div>
                    <motion.div
                      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {badges
                        .filter((b) => b.category === "system")
                        .map((badge) => (
                          <motion.div
                            key={badge.id}
                            variants={itemVariants}
                            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-blue-500/30"
                          >
                          <div className="flex flex-col h-full">
                            <div className="mb-4 text-5xl">{badge.icon || "⭐"}</div>
                            <h4 className="font-bold text-foreground text-base leading-tight">{badge.name}</h4>
                            <p className="mt-2 text-sm text-muted-foreground grow">{badge.description}</p>
                            <p className="mt-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                              Obtenida {formatDate(badge.earnedAt)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {/* Logros */}
                {badges.filter((b) => b.category === "achievement").length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Trophy className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Logros</h3>
                      <p className="text-xs text-muted-foreground">Conseguidos por participación activa</p>
                    </div>
                  </div>
                  <motion.div
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {badges
                      .filter((b) => b.category === "achievement")
                      .map((badge) => (
                        <motion.div
                          key={badge.id}
                          variants={itemVariants}
                          className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-amber-500/30"
                        >
                          <div className="flex flex-col h-full">
                            <div className="mb-4 text-5xl">{badge.icon || "🏆"}</div>
                            <h4 className="font-bold text-foreground text-base leading-tight">{badge.name}</h4>
                            <p className="mt-2 text-sm text-muted-foreground grow">{badge.description}</p>
                            <p className="mt-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                              Obtenida {formatDate(badge.earnedAt)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {/* Hitos */}
                {badges.filter((b) => b.category === "milestone").length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Milestone className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Hitos</h3>
                        <p className="text-xs text-muted-foreground">Alcanzados por longevidad</p>
                      </div>
                    </div>
                    <motion.div
                      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {badges
                        .filter((b) => b.category === "milestone")
                        .map((badge) => (
                          <motion.div
                            key={badge.id}
                            variants={itemVariants}
                            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-purple-500/30"
                          >
                            <div className="flex flex-col h-full">
                              <div className="mb-4 text-5xl">{badge.icon || "🎯"}</div>
                              <h4 className="font-bold text-foreground text-base leading-tight">{badge.name}</h4>
                              <p className="mt-2 text-sm text-muted-foreground grow">{badge.description}</p>
                              <p className="mt-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                                Obtenida {formatDate(badge.earnedAt)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Exportar memoizado para evitar re-renders innecesarios
export const ProfileTabs = memo(ProfileTabsInner);
