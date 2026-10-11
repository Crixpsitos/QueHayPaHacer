"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/app/components/motion/primitives";

const DISMISS_KEY = "qhpa-install-dismissed";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

const noopSubscribe = () => () => {};

/** "standalone" | "ios" | "other" — en servidor "other" (no pinta nada hasta hidratar). */
function getEnv() {
  if (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone) {
    return "standalone";
  }
  const ua = navigator.userAgent;
  // iPadOS 13+ se identifica como Mac con pantalla táctil.
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  // Solo Safari puede "Añadir a inicio"; Chrome/Firefox iOS usan otro menú.
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua) ? "ios" : "other";
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Invitación a instalar la PWA. Android/escritorio: captura `beforeinstallprompt`.
 * iOS Safari: instrucción manual. No aparece si ya está instalada o se descartó.
 */
export function InstallPrompt() {
  const env = useSyncExternalStore(noopSubscribe, getEnv, () => "server");
  const [dismissed, setDismissed] = useState(() => typeof window !== "undefined" && readDismissed());
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const still = useReducedMotion();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed || env === "server" || env === "standalone") return null;
  if (env !== "ios" && !deferred) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null); // el evento solo sirve una vez
  };

  return (
    <motion.div
      role="region"
      aria-label="Instalar la app"
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-3 text-white/80"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium text-white">Instala la app</p>
        {env === "ios" ? (
          <p className="text-xs leading-relaxed">
            Toca <Share aria-hidden className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
            <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.
          </p>
        ) : (
          <>
            <p className="text-xs leading-relaxed">Ábrela desde tu pantalla de inicio, más rápido y sin barra del navegador.</p>
            <button
              type="button"
              onClick={install}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-[#09090B] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Download aria-hidden className="h-4 w-4" />
              Instalar app
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Descartar invitación a instalar"
        className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
