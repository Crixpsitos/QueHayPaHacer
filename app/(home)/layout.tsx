import { HomeLayout } from "@/app/components/layout/home/HomeLayout";
import { TooltipProvider } from "../components/ui/tooltip";
import { GlobalModal } from "@/presentation/shared/components/GlobalModal";

export default function HomeRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HomeLayout>
      <GlobalModal />
      <TooltipProvider>{children}</TooltipProvider>
    </HomeLayout>
  );
}
