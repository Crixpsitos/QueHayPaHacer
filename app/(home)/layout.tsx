import { HomeLayout } from "@/app/components/layout/home/HomeLayout";
import { TooltipProvider } from "../components/ui/tooltip";

export default function HomeRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HomeLayout>
      <TooltipProvider>{children}</TooltipProvider>
    </HomeLayout>
  );
}
