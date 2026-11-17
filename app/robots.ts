import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas/funcionales fuera del índice.
      // Las combinaciones de filtros (?categoria=…&con=…) son infinitas: un rastreador las recorrió y generó ~1 M de lecturas.
      disallow: ["/studio/", "/api/", "/r/", "/actividades?*", "/donde-ir?*", "/eventos?*"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
