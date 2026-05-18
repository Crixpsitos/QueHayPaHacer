"use client";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";
import { likeEventAction } from "@/app/actions/events/like-event.action";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { updateTagAction } from "../../../../app/actions/cache/update-tag.action";
import { Button } from "@/app/components/ui/button/button";
import { useAuth } from "@/app/store/auth/AuthContext";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { EventCard } from "./EventCard";
import { shareEventAction } from "@/app/actions/events/share-event.action";

const FEATURED_EVENTS_TAG = "featured-events";

interface EventCardInteractiveProps {
  events: EventViewModel[];
  attendeeCount?: number;
  likedByEventId?: Record<string, boolean>;
  info: {title: string, description: string}
  variant?: "horizontal" | "vertical";
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
  attendeeCount = 0,
  likedByEventId = {},
  info,
  variant = "horizontal"
}: EventCardInteractiveProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<PendingLikeState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

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

    startTransition(() => {
      router.refresh();
    });

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

  const handleReload = async () => {
    setIsLoading(true);
    try {
      const result = await updateTagAction(FEATURED_EVENTS_TAG);
      if (result?.error) {
        console.error(result.error);
        setIsLoading(false);
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error reloading events:", error);
      
    }finally {
      setIsLoading(false);
    }
  };



  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {info.title}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {info.description}
        </p>
        <Button
          onClick={handleReload}
          disabled={isLoading || isPending}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="size-4" />
          {isLoading || isPending ? "Actualizando..." : "Reintentar"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-6">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            variant={variant}
            attendeeCount={attendeeCount}
            initialLikes={event.analytics?.likes ?? 0}
            initialLiked={likedByEventId[event.id] ?? false}
            onLike={handleLike}
            onShare={(ev) => shareEventAction(ev.id)}
          />
        ))}
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