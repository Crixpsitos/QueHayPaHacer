"use client";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";
import type { CSSProperties } from "react";
import { likeEventAction } from "@/app/actions/events/like-event.action";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import Link from "next/link";
import { useAuth } from "@/app/store/auth/AuthContext";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { readLikedIds, saveFreshLikes, setLikedId } from "@/app/lib/clientCache/likedIds";
import { EventCard } from "./EventCard";
import { cn } from "@/app/lib/utils/cn";

interface EventCardInteractiveProps {
  events: EventViewModel[];
  likedByEventId?: Record<string, boolean>;
  /** Estado vacío (no es un error: los errores van al error boundary). */
  info: { title: string; description?: string; action?: { href: string; label: string } };
  variant?: "horizontal" | "vertical";
  /** Máximo de columnas en modo vertical (default 4). */
  columns?: 2 | 3 | 4;
}

interface PendingLikeState {
  eventId: string;
  liked: boolean;
}

interface ToastState {
  message: string;
  type: "error" | "info";
}

export function EventCardInteractive({
  events,
  likedByEventId = {},
  info,
  variant = "horizontal",
  columns = 4,
}: EventCardInteractiveProps) {
  const router = useRouter();
  const { user, isHydrating, refreshUser } = useAuth();
  const [, startTransition] = useTransition();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<PendingLikeState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [dynamicLikes, setDynamicLikes] = useState<Record<string, boolean>>({});

  const eventIdsKey = useMemo(() => events.map((e) => e.id).join(","), [events]);
  // Ref de deduplicación: evita doble fetch cuando el efecto corre dos veces (StrictMode / Suspense)
  const fetchingRef = useRef<string | null>(null);

  // Corazones ya pintados desde lo guardado en este navegador, antes de que responda el servidor.
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    let cancelled = false;
    void readLikedIds("events", uid).then((stored) => {
      if (!cancelled) setDynamicLikes((prev) => ({ ...stored, ...prev }));
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || events.length === 0) return;
    const uid = user.uid;
    const key = `${uid}:${eventIdsKey}`;
    if (fetchingRef.current === key) return; // ya en vuelo
    fetchingRef.current = key;

    // ponytail: un POST por grilla (no por tarjeta); el home hace 2-3. Un solo fetch por página si molesta.
    fetch("/api/events/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: events.map((e) => e.id) }),
    })
      .then((r) => r.json())
      .then((likes: Record<string, boolean>) => {
        setDynamicLikes(likes);
        saveFreshLikes("events", uid, events.map((e) => e.id), likes);
        fetchingRef.current = null;
      })
      .catch(() => { fetchingRef.current = null; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, eventIdsKey]);

  const effectiveLikes = useMemo(
    // Sin sesión se ignoran los likes del fetch anterior (p. ej. tras cerrar sesión).
    () => ({ ...likedByEventId, ...(user?.uid ? dynamicLikes : {}) }),
    [likedByEventId, dynamicLikes, user?.uid],
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (message: string, type: ToastState["type"] = "info") => {
    setToast({ message, type });
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setPendingLike(null);
    showToast("Inicia sesion para completar el like.", "info");
  };

  const handleLike = async (eventId: string, liked: boolean): Promise<boolean> => {
    // Sin sesión no hace falta ir al servidor para saberlo: el modal abre al instante.
    if (!user && !isHydrating) {
      setPendingLike({ eventId, liked });
      setIsLoginModalOpen(true);
      return false;
    }
    const result = await likeEventAction(eventId, liked);

    if (result.authRequired) {
      setPendingLike({ eventId, liked });
      setIsLoginModalOpen(true);
      return false;
    }

    if (result.error) {
      showToast(result.error, "error");
      return false;
    }

    setLikedId("events", user?.uid, eventId, liked);
    return true;
  };

  const handleLoginSuccess = async () => {
    try {
      await refreshUser();

      if (pendingLike) {
        const retryResult = await likeEventAction(pendingLike.eventId, pendingLike.liked);
        if (retryResult.error) {
          showToast(retryResult.error, "error");
        }
      }

      setIsLoginModalOpen(false);
      setPendingLike(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      showToast("No se pudo completar el inicio de sesion.", "error");
    }
  };

  const handleLoginError = (message: string) => {
    showToast(message, "error");
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <p className="font-heading text-lg font-semibold text-[#09090B]">{info.title}</p>
        {info.description && (
          <p className="mt-1 max-w-md text-sm leading-relaxed text-[#71717A]">{info.description}</p>
        )}
        {info.action && (
          <Link
            href={info.action.href}
            className="mt-5 inline-flex h-11 items-center rounded-full bg-[#09090B] px-6 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-[#27272A] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2"
          >
            {info.action.label}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        variant === "vertical"
          ? `grid grid-cols-1 sm:grid-cols-2 ${columns >= 3 ? "lg:grid-cols-3" : ""} ${columns >= 4 ? "xl:grid-cols-4" : ""} gap-6`
          : "flex flex-wrap gap-6"
      )}>
        {events.map((event, index) => {
          const card = (
            <EventCard
              event={event}
              attendeeCount={event.analytics?.registrations ?? 0}
              initialLiked={effectiveLikes[event.id] ?? false}
              onLike={handleLike}
              prioritizeImage={index === 0}
            />
          );
          // Entrada solo con CSS: las primeras suben al cargar; el resto aparece al hacer scroll.
          if (variant !== "vertical") return <div key={event.id} className="contents">{card}</div>;
          return index < 4 ? (
            <div
              key={event.id}
              className={cn("card-rise h-full", index === 0 && "card-rise-first")}
              style={{ "--i": index } as CSSProperties}
            >
              {card}
            </div>
          ) : (
            <div key={event.id} className="card-reveal h-full">{card}</div>
          );
        })}
      </div>

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <button
              type="button"
              onClick={closeLoginModal}
              className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Cerrar modal"
            >
              <X className="size-4" />
            </button>

            <h3 className="mb-1 text-xl font-semibold">Inicia sesion para dar like</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Necesitamos autenticar tu cuenta para guardar tu interaccion.
            </p>

            <LoginForm
              loginAction={loginModalAction}
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`rounded-md px-4 py-2 text-sm text-white shadow-lg ${
              toast.type === "error" ? "bg-red-600" : "bg-zinc-900"
            }`}
            role="status"
          >
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}