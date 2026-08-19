"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  initialLiked: boolean;
  initialLikes: number;
  initialShares: number;
}

export function SiteDetailActions({
  siteId,
  initialLiked,
  initialLikes,
}: SiteDetailActionsProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<boolean | null>(null);

  const handleLike = useCallback(async () => {
    setLoading(true);
    const type = liked ? "unlike" : "like";
    const result = await recordSiteInteractionAction(siteId, type);

    if (result.authRequired) {
      setPendingLike(!liked);
      setIsLoginOpen(true);
      setLoading(false);
      return;
    }

    if (result.success) {
      setLiked(!liked);
      setLikes((l) => l + (liked ? -1 : 1));
    }
    setLoading(false);
  }, [liked, siteId]);

  const handleLoginSuccess = useCallback(async () => {
    await refreshUser();
    if (pendingLike !== null) {
      const type = pendingLike ? "like" : "unlike";
      const result = await recordSiteInteractionAction(siteId, type);
      if (result.success) {
        setLiked(pendingLike);
        setLikes((l) => l + (pendingLike ? 1 : -1));
      }
    }
    setIsLoginOpen(false);
    setPendingLike(null);
    startTransition(() => router.refresh());
  }, [siteId, pendingLike, refreshUser, router]);

  return (
    <>
      <Button
        variant={liked ? "default" : "outline"}
        size="lg"
        onClick={handleLike}
        disabled={loading}
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
