"use client";
import { useCallback, useEffect, useState } from "react";
import type { CarouselApi } from "@/app/components/ui/carousel";

const AUTOPLAY_MS = 6000;
const PAUSE_AFTER_USER_MS = 12000;
const HINT_KEY = "qhpa:banner-hint-seen";

/** Estado del banner: slide actual, autoplay con pausas y pista de swipe (solo la primera vez). */
export function useCampaignCarousel() {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    if (!api) return;
    const sync = () => {
      setCurrentIndex(api.selectedScrollSnap());
      setTotalItems(api.scrollSnapList().length);
    };
    sync();
    api.on("select", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("reInit", sync);
    };
  }, [api]);

  // Pista de swipe: solo en celular y solo si nunca se vio.
  useEffect(() => {
    if (!api || !window.matchMedia("(max-width: 639px)").matches) return;
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {}
    setShowSwipeHint(true);
    const hide = () => {
      setShowSwipeHint(false);
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {}
    };
    const t = setTimeout(hide, 3000);
    api.on("pointerDown", hide);
    return () => {
      clearTimeout(t);
      api.off("pointerDown", hide);
    };
  }, [api]);

  // Autoplay: pausa con mouse encima, foco, pestaña oculta, movimiento reducido y tras interacción del usuario.
  useEffect(() => {
    if (!api || api.scrollSnapList().length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = api.rootNode().parentElement;
    let hold = false;
    let pausedUntil = 0;
    const pause = () => (pausedUntil = Date.now() + PAUSE_AFTER_USER_MS);
    const enter = () => (hold = true);
    const leave = () => (hold = false);
    const timer = setInterval(() => {
      if (hold || document.hidden || Date.now() < pausedUntil) return;
      api.scrollNext();
    }, AUTOPLAY_MS);
    api.on("pointerDown", pause);
    root?.addEventListener("pointerenter", enter);
    root?.addEventListener("pointerleave", leave);
    root?.addEventListener("focusin", enter);
    root?.addEventListener("focusout", leave);
    return () => {
      clearInterval(timer);
      api.off("pointerDown", pause);
      root?.removeEventListener("pointerenter", enter);
      root?.removeEventListener("pointerleave", leave);
      root?.removeEventListener("focusin", enter);
      root?.removeEventListener("focusout", leave);
    };
  }, [api]);

  const go = useCallback(
    (fn: (a: NonNullable<CarouselApi>) => void) => {
      if (!api) return;
      fn(api);
      setShowSwipeHint(false);
    },
    [api],
  );

  return {
    setApi,
    currentIndex,
    totalItems,
    showSwipeHint,
    scrollTo: (i: number) => go((a) => a.scrollTo(i)),
    scrollPrev: () => go((a) => a.scrollPrev()),
    scrollNext: () => go((a) => a.scrollNext()),
  };
}
