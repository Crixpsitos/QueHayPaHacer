"use client";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";
import { likeEventAction } from "@/app/actions/events/like-event.action";
import { analytics as ga } from "@/app/lib/analytics";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { useAuth } from "@/app/store/auth/AuthContext";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, useRef, type ReactNode } from "react";
import { readLikedIds, saveFreshLikes, setLikedId } from "@/app/lib/clientCache/likedIds";

interface PendingLikeState {
  eventId: string;
  liked: boolean;
}

interface ToastState {
  message: string;
  type: "error" | "info";
}

/**
 * «Voy a ir» de una lista de eventos: qué marcó ya la persona (un solo POST por lista), el clic con inicio de sesión
 * si hace falta, y las capas que eso necesita (modal de acceso y aviso). Lo comparten las tarjetas y las boletas de la cartelera.
 */
export function useEventLikes(eventIds: string[], likedByEventId: Record<string, boolean> = {}): { likes: Record<string, boolean>; onLike: (eventId: string, liked: boolean) => Promise<boolean>; overlays: ReactNode } {
  const router = useRouter();
  const { user, isHydrating, refreshUser } = useAuth();
  const [, startTransition] = useTransition();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<PendingLikeState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [dynamicLikes, setDynamicLikes] = useState<Record<string, boolean>>({});

  const eventIdsKey = eventIds.join(",");
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
    if (!user?.uid || eventIds.length === 0) return;
    const uid = user.uid;
    const key = `${uid}:${eventIdsKey}`;
    if (fetchingRef.current === key) return; // ya en vuelo
    fetchingRef.current = key;

    // ponytail: un POST por grilla (no por tarjeta); el home hace 2-3. Un solo fetch por página si molesta.
    fetch("/api/events/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: eventIds }),
    })
      .then((r) => r.json())
      .then((likes: Record<string, boolean>) => {
        setDynamicLikes(likes);
        saveFreshLikes("events", uid, eventIds, likes);
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
    if (liked) ga.track("like", { item_type: "event", item_id: eventId });
    return true;
  };

  const handleLoginSuccess = async () => {
    try {
      await refreshUser();

      if (pendingLike) {
        const retryResult = await likeEventAction(pendingLike.eventId, pendingLike.liked);
        if (retryResult.error) {
          showToast(retryResult.error, "error");
        } else if (pendingLike.liked) {
          ga.track("like", { item_type: "event", item_id: pendingLike.eventId });
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

  return {
    likes: effectiveLikes,
    onLike: handleLike,
    overlays: (
      <>
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
    ),
  };
}
