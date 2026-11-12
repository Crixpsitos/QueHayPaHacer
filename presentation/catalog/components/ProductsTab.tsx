"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cop, discountPercent, groupBySection, productPrice, TAG_LABELS, todayBogota, UNIT_LABELS, WARNING_TAGS, type Product } from "@/domain/entities/catalog/Product";
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog";
import { newProduct, ProductEditor } from "./ProductEditor";
import { sectionTone } from "@/presentation/catalog/lib/tone";
import { chip, primaryBtn } from "./ui";

interface Props { siteId: string; catalog: SiteCatalog; save: (c: SiteCatalog) => Promise<string | null> }

export function ProductsTab({ siteId, catalog, save }: Props) {
  const [editing, setEditing] = useState<{ product: Product; isNew: boolean } | null>(null);
  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const today = todayBogota(new Date());
  const sections = useMemo(() => groupBySection(catalog.products).map((g) => g.section).filter((s) => s !== "Otros"), [catalog.products]);

  const shown = catalog.products.filter((p) => (!section || p.section === section) && (!q.trim() || `${p.name} ${p.description}`.toLowerCase().includes(q.trim().toLowerCase())));
  const withoutPhoto = catalog.products.filter((p) => !p.photoUrl).length;

  const persistProducts = (products: Product[]) => save({ ...catalog, products });
  const saveProduct = async (p: Product) => {
    const exists = catalog.products.some((x) => x.id === p.id);
    const err = await persistProducts(exists ? catalog.products.map((x) => (x.id === p.id ? p : x)) : [...catalog.products, p]);
    if (!err) setEditing(null);
    return err;
  };
  const remove = async (p: Product) => {
    const used = catalog.promotions.filter((x) => x.buy.productId === p.id || x.get.productId === p.id);
    if (used.length) { setNotice(`«${p.name}» se usa en ${used.length === 1 ? "la promoción" : "las promociones"} «${used.map((x) => x.title).join("», «")}». Cámbiala o elimínala primero.`); setEditing(null); return; }
    if (!confirm(`¿Eliminar «${p.name}» de tu carta?`)) return;
    setEditing(null);
    setNotice((await persistProducts(catalog.products.filter((x) => x.id !== p.id))) ?? null);
  };
  const toggle = async (p: Product) => setNotice((await persistProducts(catalog.products.map((x) => (x.id === p.id ? { ...x, available: !x.available } : x)))) ?? null);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{catalog.products.length} {catalog.products.length === 1 ? "producto" : "productos"}{withoutPhoto ? ` · faltan fotos en ${withoutPhoto}` : ""}</p>
        <button type="button" className={primaryBtn} onClick={() => setEditing({ product: newProduct(section), isNew: true })}><Plus className="size-4" aria-hidden /> Nuevo producto</button>
      </div>
      {notice && <p role="status" className="rounded-xl bg-[#FFF8E7] px-4 py-3 text-sm text-[#7a5200]">{notice}</p>}

      {catalog.products.length > 0 && (
        <div className="grid gap-3">
          <label className="flex min-h-12 max-w-sm items-center gap-2 rounded-full border border-gray-300 bg-white px-4"><Search className="size-4 text-muted-foreground" aria-hidden /><span className="sr-only">Buscar en mi carta</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en mi carta" className="w-full bg-transparent text-sm outline-none" /></label>
          {sections.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label="Secciones"><button type="button" aria-pressed={!section} className={chip(!section)} onClick={() => setSection("")}>Todo</button>{sections.map((s) => <button key={s} type="button" aria-pressed={section === s} className={chip(section === s)} onClick={() => setSection(s)}>{s}</button>)}</div>}
        </div>
      )}

      {catalog.products.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="font-heading text-xl font-bold">Tu carta está vacía</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Agrega lo que vendes —helados, plantas, libros, artesanías— con su foto y su precio. La gente podrá preguntarte por WhatsApp.</p>
          <button type="button" className={primaryBtn} onClick={() => setEditing({ product: newProduct(), isNew: true })}><Plus className="size-4" aria-hidden /> Agregar el primer producto</button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => { const pr = productPrice(p, today); return (
            <li key={p.id} className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white">
              <div className="relative flex h-32 items-end p-3" style={{ background: sectionTone(p.section).bg }}>
                {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="absolute inset-0 h-full w-full object-cover" /> : <span className="text-xs font-semibold" style={{ color: sectionTone(p.section).ink }}>sin foto</span>}
                {pr.was && <span className="absolute left-3 top-3 rounded-full bg-primary-dark px-2.5 py-1 text-xs font-bold text-white">-{discountPercent(pr.was, pr.now)}%</span>}
              </div>
              <div className="grid flex-1 gap-2 p-4">
                <h3 className="font-heading text-base font-semibold">{p.name}</h3>
                {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                <div className="flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${WARNING_TAGS.includes(t) ? "bg-[#FFF8E7] text-[#7a5200]" : "bg-[#E4F5E8] text-[#14532D]"}`}>{TAG_LABELS[t]}</span>)}{p.section && <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary-dark">{p.section}</span>}</div>
                <p className="flex items-baseline gap-2"><span className="font-heading text-xl font-bold text-primary-dark">{cop(pr.now)}</span><span className="text-xs text-muted-foreground">{UNIT_LABELS[p.unit]}</span>{pr.was && <span className="text-sm text-muted-foreground line-through">{cop(pr.was)}</span>}</p>
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                  <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-5 accent-primary-dark" checked={p.available} onChange={() => void toggle(p)} />{p.available ? "Disponible" : "Agotado"}</label>
                  <button type="button" className="min-h-11 px-2 text-sm font-semibold text-primary-dark underline" onClick={() => setEditing({ product: p, isNew: false })}>Editar</button>
                </div>
              </div>
            </li>
          ); })}
        </ul>
      )}
      {editing && <ProductEditor siteId={siteId} product={editing.product} isNew={editing.isNew} sections={sections} onSave={saveProduct} onDelete={editing.isNew ? undefined : () => void remove(editing.product)} onClose={() => setEditing(null)} />}
    </div>
  );
}
