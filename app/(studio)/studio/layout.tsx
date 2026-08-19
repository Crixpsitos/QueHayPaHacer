import type { ReactNode } from "react";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import { StudioGate } from "@/presentation/studio/components/StudioGate";
import { StudioShellFallback } from "@/presentation/studio/components/StudioShellFallback";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <ServerBoundary fallback={<StudioShellFallback />}>
      {() => <StudioGate>{children}</StudioGate>}
    </ServerBoundary>
  );
}
