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
      variant="outline"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className={cn(
        "gap-2 rounded-full px-5",
        liked && "border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
      )}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      <span className="tabular-nums">{likes.toLocaleString("es-CO")}</span>
    </Button>
  );
}
