import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";

// Áreas privadas/funcionales fuera del índice.
// Las combinaciones de filtros (?categoria=…&con=…) son infinitas: un rastreador (IPs de Meta, 57.141.0.0/16) las recorrió y generó ~1 M de lecturas.
const DISALLOW = ["/studio/", "/api/", "/r/", "/actividades?*", "/donde-ir?*", "/eventos?*"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      // Rastreadores de Meta que recorren enlaces (no son los de vista previa): un grupo propio reemplaza al de `*`, así que se repite la lista
      // y además se les cierran los listados de actividades.
      { userAgent: ["meta-externalagent", "meta-webindexer", "FacebookBot"], allow: "/", disallow: [...DISALLOW, "/actividades"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
