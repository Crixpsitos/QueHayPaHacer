"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { formatCop } from "@/domain/entities/activities/value-objects/Price";
import type { ActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory";
import { ACTIVITY_CATEGORIES } from "@/domain/entities/activities/value-objects/ActivityCategory";
import { canShowCatalog, canShowPromotions } from "@/domain/entities/catalog/catalogRules";
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog";
import { getCatalogBundleAction, saveSiteCatalogAction } from "@/app/actions/catalog/site-catalog.actions";
import { ProductsTab } from "./ProductsTab";
import { PromotionsTab, type CatalogActivityOption } from "./PromotionsTab";
import { chip } from "./ui";

interface Props { siteId: string; activityId?: string; activityTitle: string; category: ActivityCategory; productIds: string[]; onProductIds: (ids: string[]) => void }

/**
 * Carta y promociones dentro del formulario de actividades. Es la MISMA carta del sitio (el panel «Mi carta»): lo que se edita
 * aquí se ve allá y al revés. Las promociones se arman con los productos de la carta; sin productos, pide agregarlos primero.
 */
export function ActivityCatalogPanel({ siteId, activityId, activityTitle, category, productIds, onProductIds }: Props) {
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
          {data.catalog.products.length > 0 && (
            <fieldset className="grid gap-2 rounded-2xl border border-border bg-card p-4">
              <legend className="px-1 text-sm font-semibold">¿Qué productos muestra esta actividad? <span className="font-normal text-muted-foreground">(opcional)</span></legend>
              <p className="text-sm text-muted-foreground">{productIds.length ? `Mostrarás ${productIds.length} de ${data.catalog.products.length}.` : "Si no eliges ninguno, esta actividad no muestra productos."}</p>
              <ul className="grid gap-1">
                {data.catalog.products.map((p) => (
                  <li key={p.id}>
                    <label className="flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-muted/60">
                      <input type="checkbox" className="size-5 accent-primary-dark" checked={productIds.includes(p.id)} onChange={(e) => onProductIds(e.target.checked ? [...productIds, p.id] : productIds.filter((x) => x !== p.id))} />
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">{p.photoUrl ? <img src={p.photoUrl} alt="" loading="lazy" className="size-full object-cover" /> : null}</span>
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="text-sm text-muted-foreground">{formatCop(p.priceCop)}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-x-4">
                <button type="button" className="min-h-11 w-fit text-sm font-semibold text-primary-dark underline-offset-4 hover:underline" onClick={() => onProductIds(data.catalog.products.map((p) => p.id))}>Elegir todos</button>
                {productIds.length > 0 && <button type="button" className="min-h-11 w-fit text-sm font-semibold text-primary-dark underline-offset-4 hover:underline" onClick={() => onProductIds([])}>Quitar todos</button>}
              </div>
            </fieldset>
          )}
          <details className="group rounded-2xl border border-border bg-card p-4">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-semibold marker:content-none">
              <span>Editar mi carta {promosAllowed ? "y promociones" : ""}<span className="block font-normal text-muted-foreground">Agrega o cambia productos. Para elegir cuáles se ven aquí, usa la lista de arriba.</span></span>
              <span aria-hidden className="text-lg transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="mt-4 grid gap-4">
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
            </div>
          </details>
        </>
      )}
    </section>
  );
}
