"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import { recordSiteInteractionAction } from "@/app/actions/sites/record-site-interaction.action";
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
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  const handleLike = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    const type = liked ? "unlike" : "like";
    const result = await recordSiteInteractionAction(siteId, type);
    if (result.success) {
      setLiked(!liked);
      setLikes((l) => l + (liked ? -1 : 1));
    }
    setLoading(false);
  }, [liked, siteId, user?.uid]);

  return (
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
  );
}
