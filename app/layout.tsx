import { Geist, Geist_Mono, Inter } from "next/font/google";
import { AuthProvider, AuthPathWatcher } from "./store/auth/AuthProvider";
import "./globals.css";
import { cn } from "@/app/lib/utils/cn";
import { Suspense } from "react";
import { headers } from "next/headers";
import { IpLocationProvider } from "./store/Location/IpLocationProvider";
import { ServerLocationHydration } from "@/presentation/events/components/hydrator/ServerLocationHydration";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
        <AuthProvider user={null}>
          <IpLocationProvider>
            <Suspense>
              <ServerLocationHydration />
            </Suspense>

            <Suspense>
              <AuthPathWatcher />
            </Suspense>
            {children}
          </IpLocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
