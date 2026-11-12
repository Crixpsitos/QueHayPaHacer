"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import type { ActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory";
import { canShowPromotions, promoBlockReason } from "@/domain/entities/catalog/catalogRules";
import { catalogPromoSchedule, describePromo, isCatalogPromoCurrent, isCatalogPromoLive, promoPricing, PROMO_QTY_MAX, validateCatalogPromotions, type BenefitKind, type CatalogPromotion } from "@/domain/entities/catalog/CatalogPromotion";
import { cop, todayBogota } from "@/domain/entities/catalog/Product";
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog";
import { uploadCatalogImage } from "@/presentation/catalog/lib/uploadImage";
import { chip, field, hint, label, outlineBtn, primaryBtn } from "./ui";

export interface CatalogActivityOption { id: string; title: string; category: ActivityCategory; categoryName: string }
interface Props {
  siteId: string; catalog: SiteCatalog; activities: CatalogActivityOption[]; save: (c: SiteCatalog) => Promise<string | null>
  /** Actividad desde la que se arma (formulario de actividades): la promoción nueva ya nace elegida para ella. */
  focusActivityId?: string
  /** Sin productos no se puede armar una promoción: lleva a agregarlos. */
  onNeedProducts?: () => void
}

const DAYS = [["L", 1], ["M", 2], ["X", 3], ["J", 4], ["V", 5], ["S", 6], ["D", 0]] as const;
const BENEFITS: { kind: BenefitKind; text: string }[] = [{ kind: "free", text: "Gratis" }, { kind: "percent", text: "% de descuento" }, { kind: "special", text: "Precio especial" }];

const blank = (catalog: SiteCatalog, focus?: CatalogActivityOption): CatalogPromotion => {
  const today = todayBogota(new Date());
  const end = new Date(Date.now() + 30 * 86_400_000 - 5 * 3_600_000).toISOString().slice(0, 10);
  const a = catalog.products[0]?.id ?? "";
  return { id: crypto.randomUUID().slice(0, 12), title: "", imageUrl: "", buy: { productId: a, qty: 1 }, get: { productId: catalog.products[1]?.id ?? a, qty: 1 }, benefit: { kind: "percent", value: 50 }, weekdays: [], start: "", end: "", validFrom: today, validUntil: end, termsNote: "", paused: false, activityIds: focus && canShowPromotions(focus.category) ? [focus.id] : [] };
};

export function PromotionsTab({ siteId, catalog, activities, save, focusActivityId, onNeedProducts }: Props) {
  const [editing, setEditing] = useState<{ promo: CatalogPromotion; isNew: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const now = new Date();
  const persist = (promotions: CatalogPromotion[]) => save({ ...catalog, promotions });
  const canCreate = catalog.products.length > 0;

  const remove = async (x: CatalogPromotion) => {
    if (!confirm(`¿Eliminar la promoción «${x.title}»?`)) return;
    setEditing(null);
    setNotice((await persist(catalog.promotions.filter((p) => p.id !== x.id))) ?? null);
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{catalog.promotions.length} {catalog.promotions.length === 1 ? "promoción" : "promociones"}</p>
        <button type="button" disabled={!canCreate} className={primaryBtn} onClick={() => setEditing({ promo: blank(catalog, activities.find((a) => a.id === focusActivityId)), isNew: true })}><Plus className="size-4" aria-hidden /> Armar promoción</button>
      </div>
      {!canCreate && (
        <div className="grid justify-items-start gap-3 rounded-2xl bg-[#FFF8E7] p-4 text-sm text-[#7a5200]">
          <p>Una promoción se arma con productos de tu carta, y tu carta todavía está vacía. Agrega primero tus productos y vuelve aquí.</p>
          {onNeedProducts ? <button type="button" onClick={onNeedProducts} className={primaryBtn}>Agregar productos</button> : <a href={`/carta/${siteId}`} className={primaryBtn}>Ir a mi carta</a>}
        </div>
      )}
      {notice && <p role="status" className="rounded-xl bg-[#FFF8E7] px-4 py-3 text-sm text-[#7a5200]">{notice}</p>}
      <ul className="grid gap-3">
        {catalog.promotions.map((x) => {
          const current = isCatalogPromoCurrent(x, now);
          const status = x.paused ? "Pausada" : !current ? (x.validFrom > todayBogota(now) ? "Programada" : "Vencida") : isCatalogPromoLive(x, now) ? "Vigente" : "Vigente (fuera de horario)";
          return (
            <li key={x.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFB703] to-primary">{x.imageUrl && <img src={x.imageUrl} alt="" className="h-full w-full object-cover" />}</div>
              <div className="grid min-w-0 flex-1 gap-0.5"><strong className="font-heading text-base">{x.title}</strong><span className="text-sm text-muted-foreground">{describePromo(x, catalog.products)}</span><span className="text-xs text-muted-foreground">{catalogPromoSchedule(x)} · hasta el {x.validUntil} · {x.activityIds.length === 0 ? "sin actividades (solo en el sitio)" : `en ${x.activityIds.length} ${x.activityIds.length === 1 ? "actividad" : "actividades"}`}</span></div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.startsWith("Vigente") ? "bg-[#E4F5E8] text-[#14532D]" : "bg-[#FFF8E7] text-[#7a5200]"}`}>{status}</span>
              <button type="button" className="min-h-11 px-2 text-sm font-semibold text-primary-dark underline" onClick={() => setEditing({ promo: x, isNew: false })}>Editar</button>
            </li>
          );
        })}
      </ul>
      {editing && <PromotionEditor siteId={siteId} catalog={catalog} activities={activities} promo={editing.promo} isNew={editing.isNew} onClose={() => setEditing(null)} onDelete={editing.isNew ? undefined : () => void remove(editing.promo)}
        onSave={async (x) => { const list = editing.isNew ? [...catalog.promotions, x] : catalog.promotions.map((p) => (p.id === x.id ? x : p)); const err = await persist(list); if (!err) setEditing(null); return err; }} />}
    </div>
  );
}

function PromotionEditor({ siteId, catalog, activities, promo, isNew, onSave, onDelete, onClose }: { siteId: string; catalog: SiteCatalog; activities: CatalogActivityOption[]; promo: CatalogPromotion; isNew: boolean; onSave: (x: CatalogPromotion) => Promise<string | null>; onDelete?: () => void; onClose: () => void }) {
  const [x, setX] = useState(promo);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = todayBogota(new Date());
  const products = catalog.products;
  const pricing = promoPricing(x, products, today);
  const set = <K extends keyof CatalogPromotion>(k: K, v: CatalogPromotion[K]) => setX((p) => ({ ...p, [k]: v }));
  const qty = (side: "buy" | "get", d: number) => set(side, { ...x[side], qty: Math.min(PROMO_QTY_MAX, Math.max(1, x[side].qty + d)) });
  const toggleDay = (d: number) => set("weekdays", x.weekdays.includes(d) ? x.weekdays.filter((y) => y !== d) : [...x.weekdays, d]);
  const toggleAct = (id: string) => set("activityIds", x.activityIds.includes(id) ? x.activityIds.filter((y) => y !== id) : [...x.activityIds, id]);

  const upload = async (f: File) => { setUploading(true); setError(null); try { set("imageUrl", await uploadCatalogImage(siteId, f)); } catch { setError("No se pudo subir la imagen."); } finally { setUploading(false); } };
  const submit = async () => {
    const bad = validateCatalogPromotions([{ ...x, title: x.title.trim() }], products, today);
    if (bad) { setError(bad); return; }
    setBusy(true);
    const err = await onSave({ ...x, title: x.title.trim() });
    setBusy(false);
    if (err) setError(err);
  };

  const picker = (side: "buy" | "get", title: string, tone: string) => (
    <div className={`grid gap-3 rounded-2xl border-[1.5px] bg-white p-4 ${tone}`}>
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</span>
      <select aria-label={title} className={field} value={x[side].productId} onChange={(e) => set(side, { ...x[side], productId: e.target.value })}>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name} · {cop(p.priceCop)}</option>)}
      </select>
      <div className="flex items-center justify-between"><span className="text-sm font-medium">Cantidad</span>
        <div className="flex items-center gap-2"><button type="button" aria-label="Menos" className="size-11 rounded-full border border-gray-300 text-xl" onClick={() => qty(side, -1)}>-</button><span className="min-w-6 text-center font-heading text-lg font-bold">{x[side].qty}</span><button type="button" aria-label="Más" className="size-11 rounded-full border border-gray-300 text-xl" onClick={() => qty(side, 1)}>+</button></div></div>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{isNew ? "Armar promoción" : "Editar promoción"}</DialogTitle><DialogDescription>Elige dos productos: lo que compran y lo que reciben.</DialogDescription></DialogHeader>
        <div className="grid gap-6">
          <label className={label}>Nombre de la promoción<input className={field} value={x.title} maxLength={60} onChange={(e) => set("title", e.target.value)} placeholder="Tardes felices" /></label>
          <div className="grid gap-2">
            <span className="text-sm font-semibold">Imagen de la promoción</span>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-36 items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-dashed border-primary-dark bg-gradient-to-br from-[#FFB703] to-primary text-white outline-none focus-visible:ring-3 focus-visible:ring-primary-dark/40">
              {x.imageUrl ? <img src={x.imageUrl} alt="Imagen de la promoción" className="h-full w-full object-cover" /> : <span className="flex items-center gap-2 font-semibold">{uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Camera className="size-5" aria-hidden />}{uploading ? "Subiendo…" : "Subir imagen"}</span>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            <span className={hint}>Si no subes una, se usa un fondo de colores de la marca.</span>
          </div>

          <div className="grid gap-3"><span className="font-heading text-lg font-bold">1. Elige los dos productos</span><span className={hint}>Pueden ser el mismo producto o dos distintos.</span>
            {picker("buy", "Si compras", "border-primary-dark")}{picker("get", "Recibes", "border-[#FFB703]")}</div>

          <div className="grid gap-3"><span className="font-heading text-lg font-bold">2. ¿Qué gana quien lo pide?</span>
            <div role="radiogroup" aria-label="Beneficio" className="grid grid-cols-3 gap-2">{BENEFITS.map((b) => <button key={b.kind} type="button" role="radio" aria-checked={x.benefit.kind === b.kind} onClick={() => set("benefit", b.kind === "free" ? { kind: "free" } : { kind: b.kind, value: x.benefit.value })} className={`min-h-14 rounded-2xl border px-2 text-sm font-semibold ${x.benefit.kind === b.kind ? "border-primary-dark bg-primary-light text-primary-dark" : "border-gray-300 bg-white"}`}>{b.text}</button>)}</div>
            {x.benefit.kind !== "free" && <label className={label}>{x.benefit.kind === "percent" ? "Descuento sobre lo que reciben (%)" : "Precio total de lo que reciben ($)"}<input inputMode="numeric" className={field} value={x.benefit.value ?? ""} onChange={(e) => set("benefit", { kind: x.benefit.kind, value: Number(e.target.value.replace(/\D/g, "")) || undefined })} /></label>}
            {pricing && <div aria-live="polite" className="grid gap-1 rounded-2xl border border-[#F5E3B0] bg-[#FFF8E7] p-4 text-sm"><span className="text-xs font-bold uppercase tracking-wide text-[#7a5200]">Cuenta de ejemplo</span><span>Normal: <s>{cop(pricing.normal)}</s></span><strong className="font-heading text-lg text-primary-dark">Con la promoción: {cop(pricing.withPromo)}. Ahorra {cop(pricing.saves)}.</strong></div>}
          </div>

          <div className="grid gap-3"><span className="font-heading text-lg font-bold">3. ¿Cuándo vale?</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Días">{DAYS.map(([l, d]) => <button key={d} type="button" aria-pressed={x.weekdays.includes(d)} onClick={() => toggleDay(d)} className={`size-11 rounded-full border text-sm font-bold ${x.weekdays.includes(d) ? "border-transparent bg-primary-dark text-white" : "border-gray-300 bg-white"}`}>{l}</button>)}</div>
            <span className={hint}>Sin días marcados = todos los días.</span>
            <div className="grid grid-cols-2 gap-3"><label className={label}>Desde las<input type="time" className={field} value={x.start} onChange={(e) => set("start", e.target.value)} /></label><label className={label}>Hasta las<input type="time" className={field} value={x.end} onChange={(e) => set("end", e.target.value)} /></label></div>
            <div className="grid grid-cols-2 gap-3"><label className={label}>Vale desde<input type="date" className={field} value={x.validFrom} onChange={(e) => set("validFrom", e.target.value)} /></label><label className={label}>Vale hasta<input type="date" className={field} value={x.validUntil} onChange={(e) => set("validUntil", e.target.value)} /></label></div>
            <span className={hint}>Toda promoción caduca sola y nunca se muestra vencida.</span>
            <label className={label}>Condiciones <span className={hint}>(opcional)</span><input className={field} value={x.termsNote} maxLength={160} onChange={(e) => set("termsNote", e.target.value)} placeholder="Hasta agotar existencias." /></label>
          </div>

          <div className="grid gap-3"><span className="font-heading text-lg font-bold">4. ¿En qué actividades se ve?</span><span className={hint}>Siempre sale en la ficha de tu sitio. Aquí eliges además las actividades; solo las de categorías que admiten promociones.</span>
            {activities.length === 0 && <p className="text-sm text-muted-foreground">Este sitio aún no tiene actividades publicadas.</p>}
            {activities.map((a) => { const reason = promoBlockReason(a.category, a.categoryName); const on = x.activityIds.includes(a.id); return reason ? (
              <div key={a.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-100 px-4 py-2"><span className="size-5 rounded border-[1.5px] border-gray-400" aria-hidden /><span className="grid"><strong className="text-sm text-muted-foreground">{a.title}</strong><span className="text-xs text-muted-foreground">{reason}</span></span></div>
            ) : (
              <label key={a.id} className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-2 ${on ? "border-primary-dark bg-white" : "border-gray-200 bg-white"}`}><input type="checkbox" className="size-5 accent-primary-dark" checked={on} onChange={() => toggleAct(a.id)} /><span className="grid"><strong className="text-sm">{a.title}</strong><span className="text-xs text-muted-foreground">{a.categoryName}</span></span></label>
            ); })}
            {activities.length > 0 && activities.every((a) => !canShowPromotions(a.category)) && <p className="text-xs text-muted-foreground">Ninguna de tus actividades admite promociones: igual saldrá en la ficha del sitio.</p>}
          </div>

          <label className="flex min-h-12 items-center justify-between rounded-2xl border border-gray-200 px-4 text-sm font-semibold">Pausar esta promoción<input type="checkbox" role="switch" className="size-6 accent-primary-dark" checked={x.paused} onChange={(e) => set("paused", e.target.checked)} /></label>
          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          <div className="grid gap-2"><button type="button" className={primaryBtn} disabled={busy || uploading} onClick={() => void submit()}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Guardar promoción</button><button type="button" className={outlineBtn} onClick={onClose}>Cancelar</button>{onDelete && <button type="button" onClick={onDelete} className="min-h-11 text-sm font-semibold text-primary-dark underline">Eliminar promoción</button>}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
