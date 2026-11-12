"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import type { ActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory";
import { ACTIVITY_CATEGORIES } from "@/domain/entities/activities/value-objects/ActivityCategory";
import { canShowCatalog, canShowPromotions } from "@/domain/entities/catalog/catalogRules";
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog";
import { getCatalogBundleAction, saveSiteCatalogAction } from "@/app/actions/catalog/site-catalog.actions";
import { ProductsTab } from "./ProductsTab";
import { PromotionsTab, type CatalogActivityOption } from "./PromotionsTab";
import { chip } from "./ui";

interface Props { siteId: string; activityId?: string; activityTitle: string; category: ActivityCategory }

/**
 * Carta y promociones dentro del formulario de actividades. Es la MISMA carta del sitio (el panel «Mi carta»): lo que se edita
 * aquí se ve allá y al revés. Las promociones se arman con los productos de la carta; sin productos, pide agregarlos primero.
 */
export function ActivityCatalogPanel({ siteId, activityId, activityTitle, category }: Props) {
  const [data, setData] = useState<{ catalog: SiteCatalog; activities: CatalogActivityOption[] } | null | "error">(null);
  const [tab, setTab] = useState<"products" | "promos">("products");

  useEffect(() => {
    let alive = true;
    void getCatalogBundleAction(siteId).then((r) => alive && setData(r ?? "error")).catch(() => alive && setData("error"));
    return () => { alive = false; };
  }, [siteId]);

  if (!canShowCatalog(category)) return <p className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">Las actividades de esta categoría no llevan carta ni promociones.</p>;

  const save = async (next: SiteCatalog): Promise<string | null> => {
    const r = await saveSiteCatalogAction(siteId, next);
    if (!r.success) return r.error;
    setData((d) => (d && d !== "error" ? { ...d, catalog: r.catalog } : d));
    return null;
  };

  const promosAllowed = canShowPromotions(category);
  // La actividad que se está creando puede no estar publicada todavía: se agrega para poder elegirla.
  const activities = data && data !== "error" && activityId && !data.activities.some((a) => a.id === activityId)
    ? [...data.activities, { id: activityId, title: activityTitle || "Esta actividad", category, categoryName: ACTIVITY_CATEGORIES.find((c) => c.slug === category)?.name ?? "" }]
    : data && data !== "error" ? data.activities : [];

  return (
    <section className="grid gap-4" aria-labelledby="carta-t">
      <div className="grid gap-1">
        <h3 id="carta-t" className="font-heading text-lg font-bold">Carta y promociones</h3>
        <p className="text-sm text-muted-foreground">Es la carta de tu sitio: lo que agregues aquí aparece también en tu sitio y en tus otras actividades. {promosAllowed ? "Las promociones se arman con dos productos de tu carta." : "Esta categoría muestra la carta pero no admite promociones."}</p>
        <a href={`/carta/${siteId}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-primary-dark underline-offset-4 hover:underline">Abrir el panel completo de mi carta <ExternalLink className="size-3.5" aria-hidden /></a>
      </div>

      {data === null && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Cargando tu carta…</p>}
      {data === "error" && <p role="alert" className="rounded-2xl bg-[#FFF8E7] p-4 text-sm text-[#7a5200]">No pudimos cargar la carta de este sitio. Revisa que el sitio sea tuyo y esté aprobado, o ábrela desde «Mis sitios».</p>}
      {data && data !== "error" && (
        <>
          {promosAllowed && (
            <div role="tablist" aria-label="Carta" className="flex gap-2">
              <button role="tab" type="button" aria-selected={tab === "products"} className={chip(tab === "products")} onClick={() => setTab("products")}>Carta ({data.catalog.products.length})</button>
              <button role="tab" type="button" aria-selected={tab === "promos"} className={chip(tab === "promos")} onClick={() => setTab("promos")}>Promociones ({data.catalog.promotions.length})</button>
            </div>
          )}
          <div role="tabpanel">
            {tab === "products" || !promosAllowed
              ? <ProductsTab siteId={siteId} catalog={data.catalog} save={save} />
              : <PromotionsTab siteId={siteId} catalog={data.catalog} activities={activities} save={save} focusActivityId={activityId} onNeedProducts={() => setTab("products")} />}
          </div>
        </>
      )}
    </section>
  );
}
