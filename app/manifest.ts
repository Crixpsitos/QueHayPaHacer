import type { MetadataRoute } from "next";
import { SITE_NAME } from "./lib/site";

/** Web App Manifest → /manifest.webmanifest. Base de la PWA y del empaquetado TWA (Bubblewrap). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: "QHPA",
    description:
      "Guía de eventos y lugares en Ibagué: conciertos, cultura, gastronomía, deporte y sitios para salir.",
    lang: "es-CO",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAFC",
    theme_color: "#09090B",
    categories: ["events", "entertainment", "travel"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Eventos",
        short_name: "Eventos",
        description: "Eventos próximos en Ibagué",
        url: "/eventos?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "¿Dónde ir?",
        short_name: "Dónde ir",
        description: "Lugares para salir en Ibagué",
        url: "/donde-ir?source=pwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
