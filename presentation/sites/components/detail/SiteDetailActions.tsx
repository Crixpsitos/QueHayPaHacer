"use client";

import { useState, useCallback, useEffect } from "react";
import { readLikedIds, saveFreshLikes, setLikedId } from "@/app/lib/clientCache/likedIds";
import { useOptimisticLike } from "@/presentation/shared/hooks/useOptimisticLike";
import { Heart, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import { recordSiteInteractionAction } from "@/app/actions/sites/record-site-interaction.action";
import { loginModalAction } from "@/app/actions/auth/login-modal.action";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { useAuth } from "@/app/store/auth/AuthContext";

interface SiteDetailActionsProps {
  siteId: string;
  siteName: string;
  initialLikes: number;
  initialShares: number;
}

export function SiteDetailActions({ siteId, initialLikes }: SiteDetailActionsProps) {
  const { user, isHydrating, refreshUser } = useAuth();
  const uid = user?.uid ?? null;
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<boolean | null>(null);
  // Like que se aplicó al iniciar sesión desde el modal: gana sobre la lectura de sesión (puede ir atrasada).
  const [appliedLike, setAppliedLike] = useState<boolean | null>(null);
  // La ficha es igual para todos (se cachea en el CDN): si ya diste like se pide aparte cuando hay sesión.
  const [viewerLiked, setViewerLiked] = useState<{ uid: string; liked: boolean } | null>(null);

  // Corazón ya pintado desde lo guardado en este navegador, antes de que responda el servidor.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void readLikedIds("sites", uid).then((stored) => {
      if (!cancelled && stored[siteId]) setViewerLiked((prev) => prev ?? { uid, liked: true });
    });
    return () => {
      cancelled = true;
    };
  }, [uid, siteId]);

  useEffect(() => {
    if (!uid) return;
    const controller = new AbortController();
    fetch("/api/sites/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [siteId] }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<Record<string, boolean>>)
      .then((likes) => {
        saveFreshLikes("sites", uid, [siteId], likes);
        setViewerLiked({ uid, liked: likes[siteId] === true });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [uid, siteId]);

  const initialLiked = appliedLike ?? (viewerLiked?.uid === uid && uid ? viewerLiked.liked : false);

  // Optimista: corazón y contador cambian al instante; si el servidor rechaza (o falta sesión) vuelven solos.
  const { liked, count: likes, toggle } = useOptimisticLike(
    initialLiked,
    initialLikes + (appliedLike && !(viewerLiked?.liked && viewerLiked.uid === uid) ? 1 : 0),
    async (next) => {
      // Sin sesión no hace falta ir al servidor para saberlo: el modal abre al instante.
      if (!user && !isHydrating) {
        setPendingLike(next);
        setIsLoginOpen(true);
        return false;
      }
      const result = await recordSiteInteractionAction(siteId, next ? "like" : "unlike");
      if (result.authRequired) {
        setPendingLike(next);
        setIsLoginOpen(true);
        return false;
      }
      if (result.success) setLikedId("sites", uid, siteId, next);
      return result.success;
    },
  );

  const handleLoginSuccess = useCallback(async () => {
    await refreshUser();
    if (pendingLike !== null) {
      const result = await recordSiteInteractionAction(siteId, pendingLike ? "like" : "unlike");
      // El uid nuevo dispara la lectura de /api/sites/likes, que ya guarda el estado fresco.
      if (result.success) setAppliedLike(pendingLike);
    }
    setIsLoginOpen(false);
    setPendingLike(null);
  }, [siteId, pendingLike, refreshUser]);

  return (
    <>
      <Button
        variant={liked ? "default" : "outline"}
        size="lg"
        onClick={toggle}
        aria-pressed={liked}
        className={cn(
          "gap-2.5 rounded-2xl px-6 py-3 text-base font-semibold shadow-sm transition-all",
          liked
            ? "bg-rose-500 border-rose-500 text-white hover:bg-rose-600 hover:border-rose-600"
            : "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30",
        )}
      >
        <Heart className={cn("size-5", liked && "fill-current")} />
        <span className="tabular-nums">{likes > 0 ? likes.toLocaleString("es-CO") : "Me gusta"}</span>
      </Button>

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
