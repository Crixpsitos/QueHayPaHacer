import type { NextConfig } from "next";

// Versión del service worker (public/sw.js): una por build. El cliente registra
// /sw.js?v=<versión> y el SW nombra sus cachés con ella → cada deploy invalida
// HTML/assets viejos. `??=` la fija en process.env para que todas las cargas de
// este config durante el mismo build (workers) vean el mismo valor.
process.env.NEXT_PUBLIC_SW_VERSION ??= Date.now().toString(36);

const nextConfig: NextConfig = {
  /* config options here */
  // App Hosting ya fuerza standalone en su build; explícito por si cambia el adaptador.
  output: "standalone",
  cacheComponents: true,
  // ponytail: sin cacheHandlers → handler en memoria por instancia (los tags sí invalidan).
  // El handler Redis anterior no implementaba updateTags/refreshTags (P0-D). Volver a un
  // handler compartido solo con invalidación por tags real + fallback si Redis cae.
  cacheLife: {
    campaigns: {
      stale: 120,
      revalidate: 60,
      expire: 120,
    }
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**"
      }
    ],
  },

  // Migración de rutas: /events → /eventos (español, SEO). Red de seguridad por
  // si queda algún link viejo o URL externa. `:path*` cubre también /events exacto.
  // permanent:false (307) — flexible en MVP; subir a true al estabilizar.
  // Service worker: nunca cachear el script (las actualizaciones dependen de ello).
  // CSP propia del SW: sus fetch() a imágenes externas cuentan como connect-src.
  async headers() {
    // Cachés de archivos que antes salían con max-age=0 (el navegador y el CDN los pedían siempre).
    // Íconos: sus nombres no llevan hash, así que 1 semana + revalidar; el CDN sirve el resto.
    const edge = (value: string) => [{ key: "Cache-Control", value }];
    return [
      { source: "/icons/:path*", headers: edge("public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400") },
      { source: "/favicon.ico", headers: edge("public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400") },
      { source: "/manifest.webmanifest", headers: edge("public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400") },
      { source: "/robots.txt", headers: edge("public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400") },
      { source: "/sitemap.xml", headers: edge("public, max-age=0, s-maxage=3600, stale-while-revalidate=86400") },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self'; connect-src 'self' https://firebasestorage.googleapis.com https://images.unsplash.com",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/events/:path*",
        destination: "/eventos/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
