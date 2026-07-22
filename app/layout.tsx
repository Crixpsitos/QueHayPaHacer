import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AuthProvider, AuthPathWatcher } from "./store/auth/AuthProvider";
import { SITE_URL, SITE_NAME } from "./lib/site";
import "./globals.css";

const DEFAULT_DESCRIPTION =
  "Descubre eventos y planes en Ibagué: conciertos, cultura, gastronomía, deporte y más. Encuentra qué hay pa' hacer cerca de ti.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Eventos y planes en Ibagué`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  // Defaults heredados por todas las páginas (se completan con su title/description).
  openGraph: {
    siteName: SITE_NAME,
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    // "summary" hasta que haya imágenes OG; luego "summary_large_image".
    card: "summary",
  },
  robots: { index: true, follow: true },
};

/** JSON-LD site-wide: marca + sitio (base para knowledge panel / marca en Google). */
const SITE_JSONLD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "es-CO",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    areaServed: { "@type": "City", name: "Ibagué" },
  },
];
import { cn } from "@/app/lib/utils/cn";
import { Suspense } from "react";
import { IpLocationProvider } from "./store/Location/IpLocationProvider";
import { ServerLocationHydration } from "@/presentation/events/components/hydrator/ServerLocationHydration";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CO"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSONLD) }}
        />
        <AuthProvider user={null}>
          <IpLocationProvider>
            <Suspense fallback={null}>
              <ServerLocationHydration />
            </Suspense>

            <Suspense fallback={null}>
              <AuthPathWatcher />
            </Suspense>
            {children}
          </IpLocationProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
