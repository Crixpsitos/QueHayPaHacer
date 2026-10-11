import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getMyTeamAccess } from "@/app/actions/_session";
import { StudioShell } from "./StudioShell";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Acceso a datos runtime (cookies/tokens) + gating Premium.
 * Va dentro de un <Suspense> (via ServerBoundary) para no bloquear el render.
 */
export async function StudioGate({ children }: { children: ReactNode }) {
  const tokens = await getTokens(await cookies(), authConfig);

  // Solo cuentas Premium acceden al Estudio.
  if (!tokens) {
    redirect("/premium");
  }

  const { decodedToken } = tokens;
  const { userService } = createServerContainer();
  const user = await userService.getUserById(decodedToken.uid);

  // Sin Premium propio: pasa solo si es miembro (editor/lector/control de acceso) de eventos de un
  // dueño Premium → experiencia limitada. Si no, como siempre.
  let limited = false;
  if (user?.plan !== "premium") {
    const { hasTeamEvents } = await getMyTeamAccess();
    if (!hasTeamEvents) redirect("/profile");
    limited = true;
  }

  return (
    <StudioShell
      displayName={decodedToken.name ?? decodedToken.email ?? "Creador"}
      email={decodedToken.email ?? undefined}
      photoURL={decodedToken.picture ?? undefined}
      premiumLabel={limited ? "Equipo" : "Plan Premium"}
      limited={limited}
    >
      {children}
    </StudioShell>
  );
}
