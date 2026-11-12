"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { colombianNumber } from "@/domain/entities/activities/value-objects/Cta";
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog";
import { saveSiteCatalogAction } from "@/app/actions/catalog/site-catalog.actions";
import { ProductsTab } from "./ProductsTab";
import { PromotionsTab, type CatalogActivityOption } from "./PromotionsTab";
import { chip, field, hint, label, outlineBtn } from "./ui";

interface Props { siteId: string; siteName: string; initial: SiteCatalog; activities: CatalogActivityOption[] }

/** Panel «Mi carta» de un sitio: contacto, productos y promociones. Cada cambio se guarda al momento (la carta completa se valida en el servidor). */
export function CatalogManager({ siteId, siteName, initial, activities }: Props) {
  const [catalog, setCatalog] = useState(initial);
  const [tab, setTab] = useState<"products" | "promos">("products");
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [reserve, setReserve] = useState(initial.reservePhone);
  const [saving, setSaving] = useState(false);
  const [contactMsg, setContactMsg] = useState<string | null>(null);

  /** Guarda la carta completa. Devuelve el error (para mostrarlo donde se editó) o null si se guardó. */
  const save = async (next: SiteCatalog): Promise<string | null> => {
    setSaving(true);
    const r = await saveSiteCatalogAction(siteId, next);
    setSaving(false);
    if (!r.success) return r.error;
    setCatalog(r.catalog);
    return null;
  };

  const saveContact = async () => {
    for (const [v, name] of [[whatsapp, "El WhatsApp"], [reserve, "El número de reservas"]] as const) if (v.trim() && !colombianNumber(v)) { setContactMsg(`${name} debe tener 10 dígitos de Colombia.`); return; }
    const err = await save({ ...catalog, whatsapp, reservePhone: reserve });
    setContactMsg(err ?? "Contacto guardado.");
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6">
      <div className="grid gap-2">
        <Link href="/sites" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary-dark"><ChevronLeft className="size-4" aria-hidden /> Mis sitios</Link>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Mi carta</h1>
        <p className="text-muted-foreground">Lo que vendes en <strong>{siteName}</strong>. Se ve en tu sitio y en las actividades donde lo pongas. {saving && <span className="inline-flex items-center gap-1 text-xs"><Loader2 className="size-3 animate-spin" aria-hidden /> Guardando…</span>}</p>
      </div>

      <section aria-label="Contacto de la carta" className="grid gap-4 rounded-3xl border border-gray-200 bg-white p-5">
        <div className="grid gap-1"><h2 className="font-heading text-lg font-bold">¿A dónde te preguntan?</h2><p className={hint}>No somos una tienda en línea: quien quiera algo te escribe por WhatsApp con un mensaje ya armado (con lo que eligió). El pago lo arreglas tú con cada cliente.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>WhatsApp para preguntas<input className={field} inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="316 000 0000" /></label>
          <label className={label}>Número de reservas <span className={hint}>(opcional)</span><input className={field} inputMode="tel" value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="Si lo pones, sale el botón «Reservar»" /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3"><button type="button" className={outlineBtn} onClick={() => void saveContact()}>Guardar contacto</button>{contactMsg && <span role="status" className="text-sm text-muted-foreground">{contactMsg}</span>}</div>
        {!catalog.whatsapp && <p className="rounded-xl bg-[#FFF8E7] px-3 py-2 text-xs text-[#7a5200]">Sin WhatsApp la gente verá tu carta pero no podrá preguntarte desde aquí.</p>}
      </section>

      <div role="tablist" aria-label="Carta" className="flex gap-2">
        <button role="tab" type="button" aria-selected={tab === "products"} className={chip(tab === "products")} onClick={() => setTab("products")}>Productos ({catalog.products.length})</button>
        <button role="tab" type="button" aria-selected={tab === "promos"} className={chip(tab === "promos")} onClick={() => setTab("promos")}>Promociones ({catalog.promotions.length})</button>
      </div>
      <div role="tabpanel">
        {tab === "products" ? <ProductsTab siteId={siteId} catalog={catalog} save={save} /> : <PromotionsTab siteId={siteId} catalog={catalog} activities={activities} save={save} />}
      </div>
    </div>
  );
}
