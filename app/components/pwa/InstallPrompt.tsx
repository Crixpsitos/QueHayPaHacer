"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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

function useInstall() {
  const env = useSyncExternalStore(noopSubscribe, getEnv, () => "server");
  const [dismissed, setDismissed] = useState(() => typeof window !== "undefined" && readDismissed());
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

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

  const available = !dismissed && env !== "server" && env !== "standalone" && (env === "ios" || !!deferred);

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

  return { env, available, install, dismiss };
}

/**
 * Invitación a instalar la PWA. Android/escritorio: captura `beforeinstallprompt`.
 * iOS Safari: instrucción manual (Apple no permite instalar desde código).
 * No aparece si ya está instalada o se descartó.
 */
export function InstallPrompt() {
  const { env, available, install, dismiss } = useInstall();
  const still = useReducedMotion();
  if (!available) return null;

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

/** Pantallas de descubrimiento: ahí no hay CTA fijo propio que tape el banner. */
const BANNER_PATHS = ["/", "/eventos", "/donde-ir"];
const VISITS_KEY = "qhpa-visits";

/** Cuenta una visita por sesión (sessionStorage evita contar recargas). */
function countVisit() {
  try {
    if (sessionStorage.getItem("qhpa-visit-counted")) return Number(localStorage.getItem(VISITS_KEY) ?? 0);
    sessionStorage.setItem("qhpa-visit-counted", "1");
    const n = Number(localStorage.getItem(VISITS_KEY) ?? 0) + 1;
    localStorage.setItem(VISITS_KEY, String(n));
    return n;
  } catch {
    return 0;
  }
}

/**
 * Banner inferior, solo móvil, desde la 2.ª visita y solo en pantallas de descubrimiento.
 * Comparte "descartado" con el aviso del footer.
 */
export function InstallBanner() {
  const { env, available, install, dismiss } = useInstall();
  const pathname = usePathname();
  const still = useReducedMotion();
  const [visits] = useState(() => (typeof window !== "undefined" ? countVisit() : 0));

  const show = available && visits >= 2 && BANNER_PATHS.includes(pathname);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Instalar la app"
          initial={still ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-2xl bg-[#09090B] p-3 text-white shadow-xl md:hidden"
        >
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E63946] font-heading text-lg font-bold">
            Q
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">Instala Que Hay Pa Hacer?</p>
            {env === "ios" ? (
              <p className="text-xs leading-snug text-white/70">
                Toca <Share aria-hidden className="inline h-3.5 w-3.5 align-text-bottom" /> y{" "}
                <strong>Añadir a pantalla de inicio</strong>
              </p>
            ) : (
              <p className="text-xs leading-snug text-white/70">Más rápido y sin barra del navegador</p>
            )}
          </div>
          {env !== "ios" && (
            <button
              type="button"
              onClick={install}
              className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-white px-3 text-sm font-semibold text-[#09090B] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Instalar
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Descartar invitación a instalar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
