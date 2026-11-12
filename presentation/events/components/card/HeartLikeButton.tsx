"use client";

import { Button } from "@/app/components/ui/button/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils/cn";
import { CalendarCheck } from "lucide-react";
import { memo } from "react";
import { useOptimisticLike } from "@/presentation/shared/hooks/useOptimisticLike";

interface HeartLikeButtonProps {
  eventId: string;
  initialLiked?: boolean;
  initialLikes?: number;
  className?: string;
  onLike?: (eventId: string, liked: boolean) => boolean | Promise<boolean>;
}

export const HeartLikeButton = memo(function HeartLikeButton({
  eventId,
  initialLiked = false,
  initialLikes = 0,
  className,
  onLike,
}: HeartLikeButtonProps) {
  // Optimista: corazón y contador cambian al instante; si onLike rechaza, vuelven solos.
  const { liked, count: likes, toggle } = useOptimisticLike(
    initialLiked,
    initialLikes,
    async (next) => (await onLike?.(eventId, next)) !== false,
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2.5 gap-1.5 text-xs font-normal transition-colors",
            liked
              ? "text-primary-dark hover:text-primary-dark hover:bg-primary-light"
              : "text-muted-foreground hover:text-foreground",
            className,
          )}
          onClick={toggle}
          aria-label={`${liked ? "Quitar «Voy a ir»" : "Voy a ir"} — ${likes.toLocaleString("es-CO")} ${likes === 1 ? "persona va" : "personas van"}`}
          aria-pressed={liked}
        >
          <CalendarCheck
            className={cn("size-4", liked && "fill-current/20")}
            aria-hidden="true"
          />
          <span>{liked ? "Vas a ir" : "Voy a ir"}{likes > 0 ? ` · ${likes.toLocaleString("es-CO")}` : ""}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {liked ? "Quitar «Voy a ir»" : "Voy a ir"}
      </TooltipContent>
    </Tooltip>
  );
});
