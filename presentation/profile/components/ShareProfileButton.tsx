"use client";

import { useState, useCallback } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface ShareProfileButtonProps {
  username: string;
  variant?: "default" | "icon";
}

export function ShareProfileButton({ username, variant = "default" }: ShareProfileButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${username} en Que Hay Pa' Hacer`, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [username]);

  if (variant === "icon") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleShare}
        className="size-9 rounded-full border-border/60 bg-background/80 backdrop-blur-sm hover:bg-background"
        aria-label={shared ? "Enlace copiado" : "Compartir perfil"}
      >
        {shared ? <Check className="size-4" /> : <Share2 className="size-4" />}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-1.5 text-xs"
      aria-label={shared ? "Enlace copiado" : "Compartir perfil"}
    >
      {shared ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
      {shared ? "¡Copiado!" : "Compartir"}
    </Button>
  );
}
