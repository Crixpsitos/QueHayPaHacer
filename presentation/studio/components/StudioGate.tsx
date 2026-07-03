import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTokens } from "next-firebase-auth-edge";
import { filterStandardClaims } from "next-firebase-auth-edge/auth/claims";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { StudioShell } from "./StudioShell";
import {
  PROFESSIONAL_TYPE_LABEL,
  isProfessionalType,
} from "@/presentation/profile/lib/professionalType";

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
  const claims = filterStandardClaims(decodedToken);

  if (claims.role !== "professional") {
    redirect("/profile");
  }

  const professionalLabel = isProfessionalType(claims.professionalType)
    ? PROFESSIONAL_TYPE_LABEL[claims.professionalType]
    : "Profesional";

  return (
    <StudioShell
      displayName={decodedToken.name ?? decodedToken.email ?? "Organizador"}
      email={decodedToken.email ?? undefined}
      photoURL={decodedToken.picture ?? undefined}
      professionalLabel={professionalLabel}
    >
      {children}
    </StudioShell>
  );
}
