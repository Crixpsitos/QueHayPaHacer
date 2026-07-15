"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/store/auth/AuthContext";
import { likeEventAction } from "@/app/actions/events/like-event.action";
import { shareEventAction } from "@/app/actions/events/share-event.action";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { HeartLikeButton } from "./card/HeartLikeButton";
import { Button } from "@/app/components/ui/button/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Share2, Eye, Users, X, CheckCheck, Link2 } from "lucide-react";
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

export function EventDetailActions({ event, initialLiked, shareUrl, sessionId }: EventDetailActionsProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [, startTransition] = useTransition();
  const [shared, setShared] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<{ liked: boolean } | null>(null);

  const path = shareUrl ?? `/events/${event.slug || event.id}`;
  const eventUrl = typeof window !== "undefined"
    ? `${window.location.origin}${path}`
    : path;

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

  const handleShare = useCallback(async () => {
    const url = eventUrl;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
      await shareEventAction(event.id, sessionId);
    } catch {
      // user cancelled share — no-op
    }
  }, [event.id, event.title, eventUrl, sessionId]);

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

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        {/* Like + Share */}
        <div className="flex items-center gap-2">
          <HeartLikeButton
            eventId={event.id}
            initialLiked={initialLiked}
            initialLikes={analytics?.likes ?? 0}
            onLike={handleLike}
            className="h-10 px-4 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-red-50 hover:border-red-200"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="h-10 px-4 gap-2 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                onClick={handleShare}
                aria-label="Compartir evento"
              >
                {shared ? (
                  <CheckCheck className="size-4 text-green-500" />
                ) : (
                  <Share2 className="size-4 text-gray-600" />
                )}
                <span className="text-gray-700">{shared ? "¡Copiado!" : "Compartir"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {shared ? "Enlace copiado" : "Compartir evento"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Analytics counters */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {(analytics?.views ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {(analytics?.views ?? 0).toLocaleString("es-CO")}
            </span>
          )}
          {(analytics?.registrations ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {(analytics?.registrations ?? 0).toLocaleString("es-CO")}
            </span>
          )}
          {(analytics?.clicks ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Link2 className="size-3.5" />
              {(analytics?.clicks ?? 0).toLocaleString("es-CO")}
            </span>
          )}
        </div>
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
