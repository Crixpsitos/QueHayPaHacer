"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { notify } from "@/presentation/shared/lib/notify";
import { createLinkAction } from "@/app/actions/studio/create-link.action";
import { autoLinkHref } from "@/domain/entities/links/autoLinks";
import type { PanelDetail } from "@/presentation/studio/lib/panelModel";
import { CopyButton } from "@/presentation/shared/components/CopyButton";
import { ShareKit } from "@/presentation/shared/components/ShareKit";
import { fmt } from "./format";

/** Enlaces automáticos por canal (ya existen, solo se copian) con su rendimiento, y los enlaces propios opcionales. */
export function ChannelLinksCard({ detail, baseUrl }: { detail: PanelDetail; baseUrl: string }) {
  const router = useRouter();
  const [composing, setComposing] = useState(false);
  const [kitOpen, setKitOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const show = (u: string) => u.replace(/^https?:\/\//, "");

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLinkAction({ label, targetType: detail.type, targetId: detail.id });
      if (!res.success) return notify.error(res.error);
      notify.success("Enlace creado.");
      setLabel("");
      setComposing(false);
      router.refresh();
    });
  };

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[22px] font-semibold text-slate-900">Tus enlaces, ya listos</h3>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">Uno por canal, sin crear nada. Cópialo, pégalo donde publicas y aquí verás cuánta gente trae cada uno.</p>
        </div>
        <button type="button" onClick={() => setKitOpen(true)} className="inline-flex min-h-11 items-center rounded-[10px] border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Descargar afiche con QR
        </button>
      </div>
      {kitOpen && <ShareKit open kind={detail.type} id={detail.id} title={detail.name} onClose={() => setKitOpen(false)} />}

      <ul className="mt-5 flex flex-col">
        <li aria-hidden className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_80px_90px_110px] gap-4 border-b border-slate-200 pb-2.5 text-xs font-semibold text-slate-500 md:grid">
          <span>Canal</span><span>Enlace</span><span className="text-right">Visitas</span><span className="text-right">Clics en acciones</span><span />
        </li>
        {detail.channels.map((c) => {
          const url = `${baseUrl}${autoLinkHref(detail.type, detail.id, c.id)}`;
          return (
            <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-slate-100 py-3.5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_80px_90px_110px]">
              <span className="text-[15px] font-semibold text-slate-900">{c.label}</span>
              <span className="order-3 col-span-2 truncate font-mono text-[13px] text-slate-600 md:order-none md:col-span-1">{show(url)}</span>
              <span className="hidden text-right text-lg font-semibold tabular-nums md:block">{fmt(c.visits)}</span>
              <span className="hidden text-right text-lg font-semibold tabular-nums md:block">{fmt(c.actions)}</span>
              <span className="order-2 justify-self-end md:order-none"><CopyButton text={url} ariaLabel={`Copiar enlace de ${c.label}`} /></span>
              <span className="order-4 col-span-2 text-xs text-slate-500 md:hidden">{fmt(c.visits)} visitas · {fmt(c.actions)} clics en acciones</span>
            </li>
          );
        })}
      </ul>

      {detail.customLinks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-900">Tus otros enlaces</h4>
          <ul className="mt-2 divide-y divide-slate-100">
            {detail.customLinks.map((l) => (
              <li key={l.code} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{l.label}</p><p className="truncate font-mono text-xs text-slate-500">{show(`${baseUrl}/r/${l.code}`)}</p></div>
                <p className="shrink-0 text-sm tabular-nums text-slate-900"><span className="font-semibold">{fmt(l.clicks)}</span> <span className="text-xs text-slate-500">{l.clicks === 1 ? "clic" : "clics"} (30 d)</span></p>
                <CopyButton text={`${baseUrl}/r/${l.code}`} ariaLabel={`Copiar enlace ${l.label}`} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5">
        {composing ? (
          <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="own-link-label">Nombre del enlace (solo lo ves tú)</label>
            <input id="own-link-label" required autoFocus maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej.: Instagram de Nebraska" className="h-11 min-w-0 flex-1 rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus-visible:ring-2 focus-visible:ring-primary/30" />
            <button type="submit" disabled={pending || !label.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Crear enlace
            </button>
            <button type="button" onClick={() => { setComposing(false); setLabel(""); }} className="h-11 rounded-[10px] px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
          </form>
        ) : (
          <button type="button" onClick={() => setComposing(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-1 text-sm font-semibold text-slate-900 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
            <Plus className="size-4" aria-hidden /> ¿Necesitas uno aparte, como «Instagram de Nebraska»? Crear enlace propio
          </button>
        )}
      </div>
    </section>
  );
}
