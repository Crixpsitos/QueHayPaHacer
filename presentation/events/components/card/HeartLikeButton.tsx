"use client";

import { Button } from "@/app/components/ui/button/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils/cn";
import { Heart } from "lucide-react";
import { memo, useCallback, useState } from "react";

interface HeartLikeButtonProps {
  eventId: string;
  initialLiked?: boolean;
  initialLikes?: number;
  onLike?: (eventId: string, liked: boolean) => boolean | Promise<boolean>;
}

export const HeartLikeButton = memo(function HeartLikeButton({
  eventId,
  initialLiked = false,
  initialLikes = 0,
  onLike,
}: HeartLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = useCallback(async () => {
    if (isSubmitting) return;

    const next = !liked;
    setIsSubmitting(true);
    setLiked(next);
    setLikes((value) => (next ? value + 1 : value - 1));

    try {
      const accepted = await onLike?.(eventId, next);
      if (accepted === false) {
        setLiked(!next);
        setLikes((value) => (next ? value - 1 : value + 1));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [eventId, isSubmitting, liked, onLike]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2.5 gap-1.5 text-xs font-normal transition-colors",
            liked
              ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={handleLike}
          disabled={isSubmitting}
          aria-label={`${liked ? "Quitar like" : "Dar like"} — ${likes.toLocaleString("es-CO")} likes`}
          aria-pressed={liked}
        >
          <Heart
            className={cn("size-4", liked && "fill-current")}
            aria-hidden="true"
          />
          <span>{likes.toLocaleString("es-CO")}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {liked ? "Quitar me gusta" : "Me gusta"}
      </TooltipContent>
    </Tooltip>
  );
});
