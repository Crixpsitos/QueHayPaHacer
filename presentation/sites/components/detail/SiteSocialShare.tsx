"use client";

import { useCallback } from "react";
import { recordSiteInteractionAction } from "@/app/actions/sites/record-site-interaction.action";
import { SocialShareBar } from "@/presentation/shared/components/SocialShareBar";

interface SiteSocialShareProps {
  siteId: string;
  url: string;
  title: string;
  className?: string;
}

/** Wrapper client que conecta SocialShareBar con el registro de shares del sitio. */
export function SiteSocialShare({ siteId, url, title, className }: SiteSocialShareProps) {
  const handleShare = useCallback(async () => {
    await recordSiteInteractionAction(siteId, "share");
  }, [siteId]);

  return (
    <SocialShareBar
      url={url}
      title={title}
      onShare={handleShare}
      className={className}
    />
  );
}
