"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isTrackablePath } from "@/app/lib/analytics/events";
import { firstEventViewOfDay, landingSource, trackActivity, trackEvent } from "@/app/lib/eventTrack";
import { bogotaDay } from "@/domain/entities/sites/siteStats";

const MIN_VISIBLE_MS = 2000;

/**
 * Sin UI: cuenta la vista de la ficha de un evento (con o sin sesión) tras ≥ 2 s con la pestaña visible, en un momento
 * libre del navegador, y una sola vez por navegador y día. El HTML es el mismo para todos (va al CDN): la cuenta sale
 * solo del navegador. Si la pestaña se oculta antes de los 2 s, el reloj arranca de nuevo al volver a verla.
 */
export function EventViewTracker({ eventId, kind = "event" }: { eventId: string; kind?: "event" | "activity" }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!isTrackablePath(pathname)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;
    const clear = () => {
      clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
    };
    const send = () => {
      if (!firstEventViewOfDay(eventId, bogotaDay())) return;
      const src = landingSource({ href: window.location.href, referrer: document.referrer });
      if (kind === "activity") trackActivity(eventId, "view", src);
      else trackEvent(eventId, "view", src);
    };
    const start = () => {
      clear();
      if (document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", start);
        if (window.requestIdleCallback) idle = window.requestIdleCallback(send, { timeout: 2000 });
        else send();
      }, MIN_VISIBLE_MS);
    };
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      clear();
      document.removeEventListener("visibilitychange", start);
    };
  }, [eventId, kind, pathname]);
  return null;
}
