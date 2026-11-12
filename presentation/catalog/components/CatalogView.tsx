"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Tag } from "lucide-react";
import { catalogPromoSchedule, cartTotal, describePromo, isCatalogPromoCurrent, isCatalogPromoLive, promoPricing, type CatalogPromotion } from "@/domain/entities/catalog/CatalogPromotion";
import { cop, discountPercent, groupBySection, productPrice, TAG_LABELS, todayBogota, UNIT_LABELS, WARNING_TAGS, PRICES_NOTE, type Product, type ProductTag } from "@/domain/entities/catalog/Product";
import { askHref } from "@/domain/entities/catalog/whatsappAsk";
import { colombianNumber } from "@/domain/entities/activities/value-objects/Cta";

export interface CatalogViewProps {
  title: string;
  products: Product[];
  promotions: CatalogPromotion[];
  whatsapp: string;
  reservePhone: string;
  /** Actividad o sitio desde donde se pregunta (para el mensaje de WhatsApp). */
  context: { title: string; url: string };
  /** En la ficha del sitio cada promoción dice en qué actividades está. */
  activityTitles?: Record<string, string>;
  /** Enlace al panel (solo si quien mira es el dueño). */
  manageHref?: string;
}

const until = (iso: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold";

/**
 * Carta + promociones de un sitio o de una actividad. La ficha se cachea por minutos, así que la vigencia y los descuentos se
 * recomprueban en el navegador (una promoción o descuento vencido NUNCA se muestra). Sin pagos: se arma una lista y se pregunta por WhatsApp.
 */
export function CatalogView({ title, products, promotions, whatsapp, reservePhone, context, activityTitles, manageHref }: CatalogViewProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [section, setSection] = useState("");
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  useEffect(() => { const t = setTimeout(() => setNow(new Date()), 0); return () => clearTimeout(t); }, []);

  const today = now ? todayBogota(now) : "";
  const live = now ? promotions.filter((x) => isCatalogPromoCurrent(x, now)) : promotions;
  const canAsk = !!colombianNumber(whatsapp);
  const reserve = colombianNumber(reservePhone);

  const presentTags = useMemo(() => [...new Set(products.flatMap((p) => p.tags))] as ProductTag[], [products]);
  const sections = useMemo(() => groupBySection(products).map((g) => g.section), [products]);
  const shown = products.filter((p) => (!section || (p.section || "Otros") === section) && tags.every((t) => p.tags.includes(t)) && (!onlyDiscount || productPrice(p, today).was));
  const groups = groupBySection(shown);

  const lines = Object.entries(qty).filter(([, n]) => n > 0).map(([productId, n]) => ({ productId, qty: n }));
  const totals = now ? cartTotal(lines, live, products, today, now) : null;
  const items = lines.flatMap((l) => { const p = products.find((x) => x.id === l.productId); return p ? [{ name: p.name, qty: l.qty, unit: p.unit, unitPriceCop: productPrice(p, today).now }] : []; });
  const href = canAsk ? askHref(whatsapp, { activityTitle: context.title, activityUrl: context.url, items, promoTitles: totals?.applied.map((a) => a.title), totalCop: totals?.total }) : null;
  const step = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, (q[id] ?? 0) + d)) }));

  if (!products.length && !live.length) return null;

  return (
    <section aria-labelledby="catalog-title" className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="catalog-title" className="font-heading text-2xl font-extrabold tracking-tight">{title}</h2>
        {manageHref && <Link href={manageHref} className="min-h-11 inline-flex items-center text-sm font-semibold text-primary-dark underline-offset-4 hover:underline">Editar mi carta</Link>}
      </div>

      {(canAsk || reserve) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {reserve && <a href={`tel:+57${reserve}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 font-semibold text-white"><Phone className="size-4" aria-hidden /> Reservar</a>}
          {href && <a href={askHref(whatsapp, { activityTitle: context.title, activityUrl: context.url, items: [] }) ?? href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary-dark bg-white px-5 font-semibold text-primary-dark"><MessageCircle className="size-4" aria-hidden /> Preguntar por WhatsApp</a>}
        </div>
      )}

      {live.length > 0 && (
        <div className="grid gap-3">
          <h3 className="font-heading text-lg font-bold">{activityTitles ? "Todas nuestras promociones" : "Promociones"}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {live.map((x) => { const pr = promoPricing(x, products, today); const acts = (activityTitles ? x.activityIds.map((id) => activityTitles[id]).filter(Boolean) : []);
              return (
                <li key={x.id} className="overflow-hidden rounded-3xl border border-[#F6DDA0] bg-accent">
                  <div className="relative flex h-28 items-end justify-between gap-2 bg-gradient-to-br from-[#FFB703] to-primary p-3">
                    {x.imageUrl && <img src={x.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                    <span className="relative flex flex-wrap gap-1.5">{now && isCatalogPromoLive(x, now) ? <span className={`${pill} bg-primary-dark text-white`}>Ahora</span> : <span className={`${pill} bg-white text-primary-dark`}>{catalogPromoSchedule(x)}</span>}</span>
                    {pr && pr.saves > 0 && <span className={`relative ${pill} bg-[#FFB703] text-[#5C0011]`}>Ahorras {cop(pr.saves)}</span>}
                  </div>
                  <div className="grid gap-1.5 p-4">
                    <div className="flex items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-dark text-white"><Tag className="size-4" aria-hidden /></span><strong className="font-heading text-lg">{x.title}</strong></div>
                    <p className="text-sm leading-relaxed">{describePromo(x, products)}</p>
                    {acts.length > 0 && <p className="flex flex-wrap gap-1.5">{acts.map((t) => <span key={t} className={`${pill} bg-white text-foreground`}>En: {t}</span>)}</p>}
                    <p className="text-xs text-[#7a5200]">Vale hasta el {until(x.validUntil)}.{x.termsNote ? ` ${x.termsNote}` : ""}</p>
                  </div>
                </li>
              ); })}
          </ul>
        </div>
      )}

      {products.length > 0 && (
        <div className="grid gap-4">
          {(sections.length > 1 || presentTags.length > 0) && (
            <div className="grid gap-2">
              {sections.length > 1 && <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Secciones"><button type="button" aria-pressed={!section} onClick={() => setSection("")} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${!section ? "border-transparent bg-primary-dark text-white" : "border-gray-300 bg-white"}`}>Todo</button>{sections.map((s) => <button key={s} type="button" aria-pressed={section === s} onClick={() => setSection(s)} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${section === s ? "border-transparent bg-primary-dark text-white" : "border-gray-300 bg-white"}`}>{s}</button>)}</div>}
              {(presentTags.length > 0 || products.some((p) => p.discount)) && <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Para ti"><span className="flex shrink-0 items-center text-sm font-semibold text-muted-foreground">Para ti:</span>{presentTags.map((t) => { const on = tags.includes(t); return <button key={t} type="button" aria-pressed={on} onClick={() => setTags((a) => (on ? a.filter((y) => y !== t) : [...a, t]))} className={`min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-semibold ${on ? (WARNING_TAGS.includes(t) ? "border-amber-600 bg-[#FFF8E7] text-[#7a5200]" : "border-[#14532D] bg-[#E4F5E8] text-[#14532D]") : "border-gray-300 bg-white"}`}>{TAG_LABELS[t]}</button>; })}{products.some((p) => p.discount) && <button type="button" aria-pressed={onlyDiscount} onClick={() => setOnlyDiscount((v) => !v)} className={`min-h-10 shrink-0 rounded-full border px-3.5 text-sm font-semibold ${onlyDiscount ? "border-amber-600 bg-[#FFF8E7] text-[#7a5200]" : "border-gray-300 bg-white"}`}>Con descuento</button>}</div>}
            </div>
          )}
          {shown.length === 0 && <p className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground">Nada coincide con esos filtros.</p>}
          {groups.map((g) => (
            <div key={g.section} className="grid gap-3">
              {groups.length > 1 && <h3 className="font-heading text-lg font-bold text-primary-dark">{g.section}</h3>}
              <ul className="grid gap-3">
                {g.items.map((p) => { const pr = productPrice(p, today); const n = qty[p.id] ?? 0; return (
                  <li key={p.id} className={`flex gap-3 rounded-3xl border p-3 ${p.available ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-100"}`}>
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFB703] to-primary">
                      {p.photoUrl && <img src={p.photoUrl} alt={p.name} loading="lazy" className={`h-full w-full object-cover ${p.available ? "" : "opacity-60"}`} />}
                      {pr.was && p.available && <span className="absolute left-1 top-1 rounded-full bg-primary-dark px-2 py-0.5 text-[11px] font-bold text-white">-{discountPercent(pr.was, pr.now)}%</span>}
                    </div>
                    <div className="grid min-w-0 flex-1 content-start gap-1">
                      <strong className="font-heading text-base">{p.name}</strong>
                      {p.description && <span className="text-sm leading-snug text-muted-foreground">{p.description}</span>}
                      <span className="flex flex-wrap gap-1">{p.tags.map((t) => <span key={t} className={`${pill} text-[11px] ${WARNING_TAGS.includes(t) ? "bg-[#FFF8E7] text-[#7a5200]" : "bg-[#E4F5E8] text-[#14532D]"}`}>{TAG_LABELS[t]}</span>)}{!p.available && <span className={`${pill} text-[11px] bg-gray-200 text-gray-700`}>Agotado hoy</span>}</span>
                      {p.traces && <span className="text-xs text-muted-foreground">Puede contener trazas de {p.traces}.</span>}
                    </div>
                    <div className="grid content-between justify-items-end gap-2">
                      <span className="grid justify-items-end"><span className="font-heading text-lg font-bold text-primary-dark">{cop(pr.now)}</span><span className="text-xs text-muted-foreground">{UNIT_LABELS[p.unit]}</span>{pr.was && <span className="text-xs text-muted-foreground line-through">{cop(pr.was)}</span>}</span>
                      {canAsk && p.available && (n === 0 ? <button type="button" onClick={() => step(p.id, 1)} className="min-h-11 rounded-full border-[1.5px] border-primary-dark px-4 text-sm font-semibold text-primary-dark">Agregar</button> : (
                        <span className="flex items-center gap-1"><button type="button" aria-label={`Menos ${p.name}`} onClick={() => step(p.id, -1)} className="size-11 rounded-full border border-gray-300 text-lg">-</button><span className="min-w-5 text-center font-bold">{n}</span><button type="button" aria-label={`Más ${p.name}`} onClick={() => step(p.id, 1)} className="size-11 rounded-full bg-primary-dark text-lg text-white">+</button></span>
                      ))}
                    </div>
                  </li>
                ); })}
              </ul>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{PRICES_NOTE}</p>
        </div>
      )}

      {lines.length > 0 && href && totals && (
        <div className="sticky bottom-3 z-10 grid gap-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_-12px_32px_-12px_rgba(155,10,38,.25)]" role="region" aria-label="Mi lista">
          <div className="flex items-center justify-between gap-3"><strong className="font-heading text-lg">Mi lista ({lines.reduce((s, l) => s + l.qty, 0)})</strong><button type="button" onClick={() => setQty({})} className="min-h-11 px-2 text-sm font-semibold text-primary-dark underline">Vaciar</button></div>
          <p className="text-sm text-muted-foreground">{items.map((i) => `${i.qty} ${i.name}`).join(" · ")}</p>
          <p className="flex flex-wrap items-baseline gap-2"><strong className="font-heading text-xl text-primary-dark">Aprox. {cop(totals.total)}</strong>{totals.applied.length > 0 && <span className="text-xs text-[#7a5200]">con {totals.applied.map((a) => a.title).join(", ")} (ahorras {cop(totals.subtotal - totals.total)})</span>}</p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 font-semibold text-white"><MessageCircle className="size-4" aria-hidden /> Preguntar por WhatsApp</a>
          <p className="text-xs text-muted-foreground">Se abre WhatsApp con el mensaje ya escrito. Aquí no se paga: el sitio te confirma precio y disponibilidad.</p>
        </div>
      )}
    </section>
  );
}
