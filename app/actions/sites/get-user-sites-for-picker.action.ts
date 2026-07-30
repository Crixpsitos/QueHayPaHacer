"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

/**
 * Devuelve los sitios publicados y aprobados del usuario autenticado.
 * Cache muy agresivo: solo se revalida cuando el usuario crea o elimina
 * un sitio (tag `sites-{uid}`, gestionado por _revalidate.ts).
 */
export async function getUserSitesForPickerAction(): Promise<SiteDetail[]> {
  "use cache";

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return [];

  const uid = tokens.decodedToken.uid;

  cacheLife("weeks");
  cacheTag(`sites-${uid}`);

  const { sitesService } = createServerContainer();
  const sites = await sitesService.getMySites(uid);

  return sites.filter(
    (s) => s.publicationStatus === "published" && s.moderationStatus === "approved",
  );
}
