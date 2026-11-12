"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { prepareUpload, putToStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import { resizeToJpeg } from "@/presentation/catalog/lib/resizeImage";
import { cop, discountPercent, PRODUCT_DESC_MAX, PRODUCT_NAME_MAX, PRODUCT_TAGS, PRODUCT_UNITS, TAG_LABELS, validateProducts, WARNING_TAGS, type Product, type ProductTag, type ProductUnit } from "@/domain/entities/catalog/Product";
import { chip, field, hint, label, outlineBtn, primaryBtn } from "./ui";

const UNIT_NAMES: Record<ProductUnit, string> = { unidad: "Unidad", porcion: "Porción", kilo: "Kilo", libra: "Libra", docena: "Docena", bulto: "Bulto", litro: "Litro" };

export const newProduct = (section = ""): Product => ({ id: crypto.randomUUID().slice(0, 12), name: "", description: "", priceCop: 0, unit: "unidad", section, photoUrl: "", available: true, tags: [], traces: "", discount: null });

interface Props {
  siteId: string;
  product: Product;
  isNew: boolean;
  sections: string[];
  onSave: (p: Product) => Promise<string | null>;
  onDelete?: () => void;
  onClose: () => void;
}

/** Crear o editar un producto: nombre, foto, descripción, sección, precio (y descuento con fecha), etiquetas y disponibilidad. */
export function ProductEditor({ siteId, product, isNew, sections, onSave, onDelete, onClose }: Props) {
  const [p, setP] = useState<Product>(product);
  const [discounted, setDiscounted] = useState(!!product.discount);
  const [price, setPrice] = useState(product.priceCop ? String(product.priceCop) : "");
  const [dPrice, setDPrice] = useState(product.discount ? String(product.discount.priceCop) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;
  const toggleTag = (t: ProductTag) => setP((x) => {
    const has = x.tags.includes(t);
    let tags = has ? x.tags.filter((y) => y !== t) : [...x.tags, t];
    if (!has && t === "segura-mascotas") tags = tags.filter((y) => y !== "toxica-mascotas");
    if (!has && t === "toxica-mascotas") tags = tags.filter((y) => y !== "segura-mascotas");
    return { ...x, tags };
  });

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const small = await resizeToJpeg(file);
      const prepared = await prepareUpload(small, "sites", siteId, { fileName: small.name, contentType: small.type, isPublic: true, subFolder: "images" });
      await putToStorage(small, prepared, { fileName: small.name, contentType: small.type, isPublic: true });
      set("photoUrl", prepared.publicUrl);
    } catch {
      setError("No se pudo subir la foto. Intenta con otra.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const next: Product = { ...p, name: p.name.trim(), priceCop: num(price), discount: discounted && p.discount ? { priceCop: num(dPrice), until: p.discount.until } : discounted ? { priceCop: num(dPrice), until: "" } : null };
    const bad = validateProducts([next]);
    if (bad) { setError(bad); return; }
    setBusy(true);
    const err = await onSave(next);
    setBusy(false);
    if (err) setError(err);
  };

  const was = num(price);
  const now = num(dPrice);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nuevo producto" : "Editar producto"}</DialogTitle>
          <DialogDescription>Lo que pones aquí se ve en tu sitio y en las actividades donde lo incluyas.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <span className="text-sm font-semibold">Foto del producto</span>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-dashed border-primary-dark bg-gradient-to-br from-[#FFB703] to-[#F59E0B] text-[#5C0011] outline-none focus-visible:ring-3 focus-visible:ring-primary-dark/40">
              {p.photoUrl ? <img src={p.photoUrl} alt={`Foto de ${p.name || "el producto"}`} className="h-full w-full object-cover" /> : (
                <span className="flex items-center gap-2 font-semibold">{uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Camera className="size-5" aria-hidden />}{uploading ? "Subiendo…" : "Subir foto"}</span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            <span className={hint}>Una foto con buena luz. Sin foto, el producto sale con el color de su sección.</span>
          </div>

          <label className={label}>Nombre<input className={field} value={p.name} maxLength={PRODUCT_NAME_MAX} onChange={(e) => set("name", e.target.value)} placeholder="Helado de maracuyá" /></label>
          <label className={label}><span className="flex justify-between">Descripción <span className={hint}>{p.description.length} de {PRODUCT_DESC_MAX}</span></span>
            <textarea className={`${field} py-2`} rows={3} maxLength={PRODUCT_DESC_MAX} value={p.description} onChange={(e) => set("description", e.target.value)} /></label>
          <label className={label}>Sección de la carta
            <input className={field} list="catalog-sections" value={p.section} maxLength={40} onChange={(e) => set("section", e.target.value)} placeholder="Helados, Plantas de interior…" />
            <datalist id="catalog-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
            <span className={hint}>Así se agrupa. Escribe una nueva o elige una que ya tienes.</span></label>

          <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-[1.2fr_1fr] gap-3">
              <label className={label}>Precio normal<span className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3"><span className="text-muted-foreground">$</span><input inputMode="numeric" className="min-h-11 w-full bg-transparent text-sm outline-none" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))} placeholder="8500" /></span></label>
              <label className={label}>Se vende por<select className={field} value={p.unit} onChange={(e) => set("unit", e.target.value as ProductUnit)}>{PRODUCT_UNITS.map((u) => <option key={u} value={u}>{UNIT_NAMES[u]}</option>)}</select></label>
            </div>
            <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">
              <span className="grid"><span>Este producto está en descuento</span><span className={hint}>Muestra el precio anterior tachado.</span></span>
              <input type="checkbox" role="switch" className="size-6 accent-primary-dark" checked={discounted} onChange={(e) => setDiscounted(e.target.checked)} />
            </label>
            {discounted && (
              <div className="grid gap-3 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-[1.2fr_1fr] items-end gap-3">
                  <label className={label}>Precio con descuento<span className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3"><span className="text-muted-foreground">$</span><input inputMode="numeric" className="min-h-11 w-full bg-transparent text-sm outline-none" value={dPrice} onChange={(e) => setDPrice(e.target.value.replace(/[^\d]/g, ""))} /></span></label>
                  <div aria-live="polite" className="grid min-h-11 place-items-center rounded-xl bg-primary-dark font-bold text-white">{was > 0 && now > 0 && now < was ? `-${discountPercent(was, now)}%` : "—"}</div>
                </div>
                <label className={label}>El descuento vale hasta<input type="date" className={field} value={p.discount?.until ?? ""} onChange={(e) => setP((x) => ({ ...x, discount: { priceCop: num(dPrice), until: e.target.value } }))} /><span className={hint}>Todo descuento caduca solo: nunca se muestra uno vencido.</span></label>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div className="grid gap-1"><span className="text-lg font-bold font-heading">Para quién es</span><span className={hint}>Marca solo lo que de verdad cumple. Ayuda a quien tiene una dieta, una alergia o una mascota a decidir rápido.</span></div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Etiquetas">
              {PRODUCT_TAGS.map((t) => { const on = p.tags.includes(t); const warn = WARNING_TAGS.includes(t); return (
                <button key={t} type="button" aria-pressed={on} onClick={() => toggleTag(t)} className={`${chip(false)} ${on ? (warn ? "!border-amber-600 !bg-[#FFF8E7] !text-[#7a5200]" : "!border-[#14532D] !bg-[#E4F5E8] !text-[#14532D]") : ""}`}>{TAG_LABELS[t]}</button>
              ); })}
            </div>
            <label className={label}>Puede contener trazas de <span className={hint}>(opcional)</span><input className={field} value={p.traces} maxLength={80} onChange={(e) => set("traces", e.target.value)} placeholder="leche y huevo" /></label>
            <p className="rounded-xl bg-[#FFF8E7] px-3 py-2 text-xs leading-relaxed text-[#7a5200]">Estas etiquetas las declaras tú: la plataforma no las certifica. Con alergias graves, la gente confirma con el lugar.</p>
          </div>

          <label className="flex min-h-12 items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold">Disponible hoy<input type="checkbox" role="switch" className="size-6 accent-primary-dark" checked={p.available} onChange={(e) => set("available", e.target.checked)} /></label>

          {price && <p className="text-xs text-muted-foreground">Así se verá el precio: <strong>{cop(discounted && now > 0 && now < was ? now : was)}</strong></p>}
          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          <div className="grid gap-2">
            <button type="button" className={primaryBtn} disabled={busy || uploading} onClick={() => void save()}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Guardar producto</button>
            <button type="button" className={outlineBtn} onClick={onClose}>Cancelar</button>
            {onDelete && <button type="button" onClick={onDelete} className="min-h-11 text-sm font-semibold text-primary-dark underline">Eliminar producto</button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
