import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { StudioShell } from "./StudioShell";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Acceso a datos runtime (cookies/tokens) + gating profesional.
 * Va dentro de un <Suspense> (via ServerBoundary) para no bloquear el render.
 */
export async function StudioGate({ children }: { children: ReactNode }) {
  const tokens = await getTokens(await cookies(), authConfig);

  // Solo cuentas profesionales acceden al Estudio.
  if (!tokens) {
    redirect("/profile");
  }

  const { decodedToken } = tokens;
  const { userService } = createServerContainer();
  const user = await userService.getUserById(decodedToken.uid);

  if (user?.plan !== "premium") {
    redirect("/profile");
  }

  return (
    <StudioShell
      displayName={decodedToken.name ?? decodedToken.email ?? "Creador"}
      email={decodedToken.email ?? undefined}
      photoURL={decodedToken.picture ?? undefined}
      premiumLabel="Plan Premium"
    >
      {children}
    </StudioShell>
  );
}
