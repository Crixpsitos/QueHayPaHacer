import type { Metadata } from "next";
import { HomeLayout } from "@/app/components/layout/home/HomeLayout";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { GlobalModal } from "@/presentation/shared/components/GlobalModal";

// Áreas privadas (/profile, /mis-eventos): fuera del índice.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Mismo shell que (home): Navbar + Footer.
export default function ProfileGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayout>
      <GlobalModal />
      <TooltipProvider>{children}</TooltipProvider>
    </HomeLayout>
  );
}
