"use server";

import { updateTag } from "next/cache";
import { getSessionUid } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog";
import { ACTIVITY_CATEGORIES } from "@/domain/entities/activities/value-objects/ActivityCategory";
import type { CatalogActivityOption } from "@/presentation/catalog/components/PromotionsTab";

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/** Carta del sitio para su dueño (panel «Mi carta»). null si no hay sesión o el sitio no es suyo. */
export async function getMySiteCatalogAction(siteId: string): Promise<SiteCatalog | null> {
  const uid = await getSessionUid();
  if (!uid || !ID_RE.test(siteId ?? "")) return null;
  return createServerContainer().siteCatalogService.getForOwner(uid, siteId);
}

/** La carta y las actividades del sitio (para elegir en cuáles se ve cada promoción). Solo el dueño. */
export async function getCatalogBundleAction(siteId: string): Promise<{ catalog: SiteCatalog; activities: CatalogActivityOption[] } | null> {
  const uid = await getSessionUid();
  if (!uid || !ID_RE.test(siteId ?? "")) return null;
  const { siteCatalogService, activityService } = createServerContainer();
  const catalog = await siteCatalogService.getForOwner(uid, siteId);
  if (!catalog) return null;
  const names = new Map<string, string>(ACTIVITY_CATEGORIES.map((c) => [c.slug, c.name]));
  const activities = (await activityService.listForSite(siteId)).map((a) => ({ id: a.id, title: a.title, category: a.category, categoryName: names.get(a.category) ?? a.category }));
  return { catalog, activities };
}

/** ¿El sitio es mío? Para mostrar «Editar mi carta» solo a su dueño en las fichas públicas (que se cachean y no saben quién mira). */
export async function canManageSiteAction(siteId: string): Promise<boolean> {
  const uid = await getSessionUid();
  if (!uid || !ID_RE.test(siteId ?? "")) return false;
  return createServerContainer().sitesService.isOwner(uid, siteId).catch(() => false);
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
    updateTag("promo-activity-ids");
    return { success: true, catalog: r.catalog };
  } catch (e) {
    console.error("[save-site-catalog]", e instanceof Error ? e.message : "error");
    return { success: false, error: "No se pudo guardar la carta. Intenta de nuevo." };
  }
}
