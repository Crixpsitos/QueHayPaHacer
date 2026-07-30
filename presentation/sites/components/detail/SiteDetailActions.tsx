"use client";

import { useState, useCallback } from "react";
import { Heart, Share2, Check } from "lucide-react";
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
  siteName,
  initialLiked,
  initialLikes,
  initialShares,
}: SiteDetailActionsProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [shared, setShared] = useState(false);
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

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/donde-ir/${siteId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: siteName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch { /* user cancelled */ }
    await recordSiteInteractionAction(siteId, "share");
    setShares((s) => s + 1);
  }, [siteId, siteName]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLike}
        disabled={loading}
        className={cn(
          "gap-2 rounded-full",
          liked && "border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
        <span className="tabular-nums">{likes.toLocaleString("es-CO")}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="gap-2 rounded-full"
      >
        {shared ? (
          <><Check className="size-4 text-green-500" /> Copiado</>
        ) : (
          <><Share2 className="size-4" />{shares > 0 && <span className="tabular-nums">{shares.toLocaleString("es-CO")}</span>}</>
        )}
      </Button>
    </div>
  );
}
