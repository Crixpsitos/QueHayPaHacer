"use client";
import { useEffect, useState } from "react";
import { saveFreshLikes } from "@/app/lib/clientCache/likedIds";
import { useStoredLiked } from "@/app/lib/clientCache/useStoredLiked";
import { useAuth } from "@/app/store/auth/AuthContext";
import type { TeamViewerRole } from "../components/EventDetailClient";

export interface EventViewer {
  liked: boolean;
  registered: boolean;
  isOwner: boolean;
  teamRole?: TeamViewerRole;
  isPremiumOwner: boolean;
  /** false mientras no se sabe quién mira: no mostrar acciones que dependen de la persona (p. ej. Inscribirme). */
  ready: boolean;
}

interface ViewerPayload extends Omit<EventViewer, "ready"> {
  uid: string | null;
}

const ANONYMOUS: Omit<EventViewer, "ready"> = { liked: false, registered: false, isOwner: false, isPremiumOwner: false };

/**
 * Estado de la persona que mira el evento. La página es igual para todos (se cachea en el CDN), así que
 * liked/registered/isOwner/teamRole se piden aparte a /api/events/[id]/viewer cuando hay sesión.
 */
export function useEventViewer(eventId: string, sessionId?: string): EventViewer {
  const { user, isHydrating } = useAuth();
  const uid = user?.uid ?? null;
  const [data, setData] = useState<{ key: string; viewer: ViewerPayload } | null>(null);
  const key = `${uid}:${eventId}:${sessionId ?? ""}`;
  const storedLiked = useStoredLiked("events", uid, eventId);

  useEffect(() => {
    if (isHydrating || !uid) return;
    const controller = new AbortController();
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    fetch(`/api/events/${encodeURIComponent(eventId)}/viewer${qs}`, { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<ViewerPayload>) : Promise.reject(new Error(String(r.status)))))
      .then((viewer) => {
        if (!sessionId) saveFreshLikes("events", uid, [eventId], { [eventId]: viewer.liked });
        setData({ key, viewer });
      })
      // Si falla, se muestra como visitante: mejor ofrecer las acciones públicas que dejarlas bloqueadas.
      .catch((e) => !controller.signal.aborted && setData({ key, viewer: { uid, ...ANONYMOUS } }));
    return () => controller.abort();
  }, [isHydrating, uid, eventId, sessionId, key]);

  if (isHydrating) return { ...ANONYMOUS, ready: false };
  if (!uid) return { ...ANONYMOUS, ready: true };
  // Aún no responde el servidor: se muestra el like guardado (el resto de la ficha espera lo fresco).
  if (data?.key !== key) return { ...ANONYMOUS, liked: !sessionId && storedLiked, ready: false };
  return { ...ANONYMOUS, ...data.viewer, ready: true };
}
