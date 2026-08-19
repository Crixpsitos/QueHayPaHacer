import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas/funcionales fuera del índice.
      disallow: ["/studio/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
