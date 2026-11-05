"use client";

import { useEffect } from "react";
import { analytics } from "@/app/lib/analytics";

/** Sin UI: avisa a Analytics que se abrió la ficha de un evento (una vez por apertura). Los sitios lo hacen en SiteTracker. */
export function ViewItem({ type, id, category }: { type: "event" | "site"; id: string; category?: string }) {
  useEffect(() => {
    analytics.track("view_item", { item_type: type, item_id: id, item_category: category });
  }, [type, id, category]);
  return null;
}
