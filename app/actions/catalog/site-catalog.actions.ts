"use server";

import { updateTag } from "next/cache";
import { getSessionUid } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog";

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/** Carta del sitio para su dueño (panel «Mi carta»). null si no hay sesión o el sitio no es suyo. */
export async function getMySiteCatalogAction(siteId: string): Promise<SiteCatalog | null> {
  const uid = await getSessionUid();
  if (!uid || !ID_RE.test(siteId ?? "")) return null;
  return createServerContainer().siteCatalogService.getForOwner(uid, siteId);
}

/** Guarda la carta completa (productos, promociones, contacto). Valida y normaliza en el servidor; solo el dueño. */
export async function saveSiteCatalogAction(siteId: string, input: SiteCatalog): Promise<{ success: true; catalog: SiteCatalog } | { success: false; error: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: "Inicia sesión para guardar tu carta." };
  if (!ID_RE.test(siteId ?? "")) return { success: false, error: "Sitio inválido." };
  try {
    const r = await createServerContainer().siteCatalogService.save(uid, siteId, input);
    if (!r.ok) return { success: false, error: r.error };
    updateTag(`site-catalog-${siteId}`);
    updateTag(`site-${siteId}`);
    return { success: true, catalog: r.catalog };
  } catch (e) {
    console.error("[save-site-catalog]", e instanceof Error ? e.message : "error");
    return { success: false, error: "No se pudo guardar la carta. Intenta de nuevo." };
  }
}
