import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  
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
      }
    ],
  },

  // Migración de rutas: /events → /eventos (español, SEO). Red de seguridad por
  // si queda algún link viejo o URL externa. `:path*` cubre también /events exacto.
  // permanent:false (307) — flexible en MVP; subir a true al estabilizar.
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
