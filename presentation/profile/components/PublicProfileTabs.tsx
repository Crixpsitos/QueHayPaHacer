"use client";

import { useEffect, useState, memo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Activity, MapPin, Award, Calendar, Eye, Heart, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import type { UserBadge, UserEvent, UserSite } from "@/domain/repository/profile/IProfileRepository";
import { PublicEventCard } from "./PublicEventCard";
import { siteCategoryLabel } from "@/presentation/sites/lib/constants";

interface PublicProfileTabsProps {
  uid: string;
  fetchUserEvents: (uid: string) => Promise<UserEvent[]>;
  fetchUserSites: (uid: string) => Promise<UserSite[]>;
  fetchUserBadges: (uid: string) => Promise<UserBadge[]>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  exit: { opacity: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(date));

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
    {text}
  </div>
);

const LoadingState = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
    <Loader2 className="size-5 animate-spin" />
    <span className="text-sm">{text}</span>
  </div>
);

function PublicProfileTabsInner({ uid, fetchUserEvents, fetchUserSites, fetchUserBadges }: PublicProfileTabsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [sites, setSites] = useState<UserSite[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);

  // Tab state driven by URL query param; likes is not available on public profiles
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const PUBLIC_VALID_TABS = ["events", "sites", "badges"];
  const rawTab = searchParams.get("tab") ?? "";
  const activeTab = PUBLIC_VALID_TABS.includes(rawTab) ? rawTab : "events";

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [eventsData, sitesData, badgesData] = await Promise.all([
          fetchUserEvents(uid),
          fetchUserSites(uid),
          fetchUserBadges(uid),
        ]);

        if (!mounted) return;
        setEvents(eventsData);
        setSites(sitesData);
        setBadges(badgesData);
      } catch (error) {
        if (!mounted) return;
        console.error("Error loading public profile data:", error);
        setLoadError("No pudimos cargar la información de este perfil. Intenta nuevamente.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [uid, fetchUserEvents, fetchUserSites, fetchUserBadges]);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="border-b border-border">
          <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="events"
              className="relative flex min-w-max items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Activity className="h-4 w-4 shrink-0" aria-hidden />
              <span>Eventos</span>
            </TabsTrigger>
            <TabsTrigger
              value="sites"
              className="relative flex min-w-max items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span>Sitios</span>
            </TabsTrigger>
            <TabsTrigger
              value="badges"
              className="relative flex min-w-max items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Award className="h-4 w-4 shrink-0" aria-hidden />
              <span>Insignias</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events" className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingState key="events-loading" text="Cargando eventos..." />
            ) : loadError ? (
              <EmptyState key="events-error" text={loadError} />
            ) : events.length === 0 ? (
              <EmptyState key="events-empty" text="Este usuario aún no ha publicado eventos." />
            ) : (
              <motion.div
                key="events-content"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {events.map((event, eventIndex) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <PublicEventCard event={event} priority={eventIndex === 0} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="sites" className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingState key="sites-loading" text="Cargando sitios..." />
            ) : sites.length === 0 ? (
              <EmptyState key="sites-empty" text="Este usuario aún no ha agregado sitios." />
            ) : (
              <motion.div
                key="sites-content"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {sites.map((site, siteIndex) => (
                  <motion.article
                    key={site.id}
                    variants={itemVariants}
                    className="group overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
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
                              loading={siteIndex === 0 ? "eager" : "lazy"}
                              priority={siteIndex === 0}
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <Building2 className="size-10" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3">
                          <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                            {siteCategoryLabel(site.category) || "Sitio"}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="space-y-2 p-4">
                      <Link href={`/donde-ir/${site.slug || site.id}`}>
                        <p className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">{site.name}</p>
                      </Link>
                      {site.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{site.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Eye className="size-3.5" />{site.analytics.views.toLocaleString("es-CO")}</div>
                        <div className="flex items-center gap-1"><Heart className="size-3.5" />{site.analytics.likes.toLocaleString("es-CO")}</div>
                        <div className="flex items-center gap-1"><Calendar className="size-3.5" />{site.analytics.eventCount} eventos</div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingState key="badges-loading" text="Cargando insignias..." />
            ) : badges.length === 0 ? (
              <EmptyState key="badges-empty" text="Este usuario aún no tiene insignias." />
            ) : (
              <motion.div
                key="badges-content"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    variants={itemVariants}
                    className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:shadow-lg hover:border-brand-violet/30"
                  >
                    <div className="flex h-full flex-col">
                      <div className="mb-4 text-5xl">{badge.icon || "⭐"}</div>
                      <h4 className="text-base font-bold leading-tight text-foreground">{badge.name}</h4>
                      <p className="mt-2 grow text-sm text-muted-foreground">{badge.description}</p>
                      <p className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        Obtenida {formatDate(badge.earnedAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export const PublicProfileTabs = memo(PublicProfileTabsInner);
