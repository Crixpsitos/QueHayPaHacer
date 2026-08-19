"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/store/auth/AuthContext";
import { likeEventAction } from "@/app/actions/events/like-event.action";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { HeartLikeButton } from "./card/HeartLikeButton";
import { Eye, X } from "lucide-react";
import type { EventViewModel } from "../view-models/EventViewModel";

interface EventDetailActionsProps {
  event: EventViewModel;
  initialLiked: boolean;
  /** Ruta a compartir (p.ej. la de una sesión). Por defecto: la del evento. */
  shareUrl?: string;
  /** Si se pasa, el COMPARTIR se registra contra la sesión. El like siempre es
   *  del evento: es el estado de una persona y duplicarlo la contaría dos veces. */
  sessionId?: string;
}

export function EventDetailActions({ event, initialLiked, sessionId }: EventDetailActionsProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [, startTransition] = useTransition();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<{ liked: boolean } | null>(null);

  const handleLike = useCallback(async (eventId: string, liked: boolean): Promise<boolean> => {
    const result = await likeEventAction(eventId, liked);

    if (result.authRequired) {
      setPendingLike({ liked });
      setIsLoginOpen(true);
      return false;
    }

    if (result.error) return false;

    // HeartLikeButton already handles optimistic state — no router.refresh() needed
    return true;
  }, []);

  const handleLoginSuccess = useCallback(async () => {
    await refreshUser();
    if (pendingLike) {
      await likeEventAction(event.id, pendingLike.liked);
    }
    setIsLoginOpen(false);
    setPendingLike(null);
    startTransition(() => router.refresh());
  }, [event.id, pendingLike, refreshUser, router]);

  const analytics = event.analytics;
  const views = analytics?.views ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Like — botón grande estilo Airbnb */}
        {!sessionId && (
          <HeartLikeButton
            eventId={event.id}
            initialLiked={initialLiked}
            initialLikes={analytics?.likes ?? 0}
            onLike={handleLike}
            className="h-11 gap-2.5 rounded-xl border border-[#E4E4E7] bg-white px-5 text-sm font-semibold text-[#09090B] shadow-card transition-all hover:border-[#E63946] hover:bg-[#FDF2F4] hover:text-[#E63946]"
          />
        )}

        {/* Vistas — pill solo en el evento padre, no en sesiones */}
        {!sessionId && (
        <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E4E4E7] bg-white px-4 shadow-card">
          <Eye className="size-4 text-[#A1A1AA]" />
          <span className="text-sm font-semibold text-[#09090B]">
            {views.toLocaleString("es-CO")}
          </span>
          <span className="text-xs text-[#A1A1AA]">
            {views === 1 ? "vista" : "vistas"}
          </span>
        </div>
        )}
      </div>

      {/* Login modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <button
              type="button"
              onClick={() => { setIsLoginOpen(false); setPendingLike(null); }}
              className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
            <h3 className="mb-1 text-xl font-semibold">Inicia sesión para dar like</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Necesitamos autenticar tu cuenta para guardar tu interacción.
            </p>
            <LoginForm
              loginAction={loginModalAction}
              onSuccess={handleLoginSuccess}
              onError={(msg) => console.error(msg)}
            />
          </div>
        </div>
      )}
    </>
  );
}
