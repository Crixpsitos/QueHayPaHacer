"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";
import { isLinkableSite } from "@/domain/entities/sites/siteLink";

/**
 * Función cached separada — recibe uid como argumento para que el cache
 * sea por usuario. No puede usar cookies() directamente porque las
 * funciones "use cache" deben ser deterministas.
 */
async function fetchSitesByUid(uid: string): Promise<SiteDetail[]> {
  "use cache";
  cacheLife("weeks");
  cacheTag(`sites-${uid}`);

  const { sitesService } = createServerContainer();
  const sites = await sitesService.getMySites(uid);

  // Solo sitios propios de verdad: publicados como dueño y aprobados (no los "propuestos" ni los de QHPA).
  // `getMySites(uid)` ya trae solo los del usuario. El servidor vuelve a validar al guardar el evento.
  return sites.filter(isLinkableSite);
}

/**
 * Server Action pública. Lee la sesión del usuario y delega en la
 * función cached para que el resultado quede almacenado por semanas.
 * Se invalida automáticamente cuando se crea/edita/elimina un sitio
 * (tag `sites-{uid}` en _revalidate.ts).
 */
export async function getUserSitesForPickerAction(): Promise<SiteDetail[]> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) return [];
  return fetchSitesByUid(tokens.decodedToken.uid);
}
