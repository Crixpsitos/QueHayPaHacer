"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Activity, MapPin, Award, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import type { UserBadge, UserEvent, UserSite } from "@/domain/repository/profile/IProfileRepository";
import { PublicEventCard } from "./PublicEventCard";

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
  const [activeTab, setActiveTab] = useState("events");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [sites, setSites] = useState<UserSite[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);

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
      className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-3 bg-muted/60">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="sites" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Sitios</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Insignias</span>
          </TabsTrigger>
        </TabsList>

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
                {events.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <PublicEventCard event={event} />
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
                className="grid gap-3 sm:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {sites.map((site) => (
                  <motion.div
                    key={site.id}
                    variants={itemVariants}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <p className="font-semibold text-foreground">{site.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{site.address}</p>
                  </motion.div>
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
