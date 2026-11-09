"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Copy, ExternalLink, Info, Loader2, MapPin, Plus } from "lucide-react";
import { notify } from "@/presentation/shared/lib/notify";
import { createLinkAction } from "@/app/actions/studio/create-link.action";
import type { FichaCard } from "@/presentation/studio/lib/linksOverview";
import { SourceBar } from "./SourceBar";

const PRESETS = ["Instagram (bio)", "Instagram (historias)", "WhatsApp", "Facebook", "Afiche con QR"];
const fmt = (n: number) => n.toLocaleString("es-CO");

export function FichaCardView({ ficha, baseUrl }: { ficha: FichaCard; baseUrl: string }) {
  const router = useRouter();
  const [composing, setComposing] = useState(false);
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const urlOf = (code: string) => `${baseUrl}/r/${code}`;
  const isEvent = ficha.type === "event";
  const publicHref = isEvent ? `/eventos/${ficha.id}` : `/donde-ir/${ficha.id}`;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(urlOf(code));
      setCopied(code);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1800);
    } catch {
      notify.error("No se pudo copiar. Selecciona el enlace y cópialo a mano.");
    }
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createLinkAction({ label, targetType: ficha.type, targetId: ficha.id });
      if (!res.success) return notify.error(res.error);
      notify.success("Enlace creado y copiado.");
      setLabel("");
      setComposing(false);
      router.refresh();
      void copy(res.code);
    });
  };

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:gap-4">
        {ficha.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura de panel, URL ya optimizada por el origen
          <img src={ficha.image} alt="" className="size-14 shrink-0 rounded-lg bg-gray-100 object-cover sm:size-16" />
        ) : (
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-slate-400 sm:size-16">
            {isEvent ? <CalendarDays className="size-6" /> : <MapPin className="size-6" />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900">{ficha.name}</h2>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            {isEvent ? "Evento" : "Sitio"}
            <a href={publicHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-slate-600 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
              Ver ficha <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        </div>
        <dl className="flex w-full shrink-0 gap-6 sm:w-auto sm:gap-5 sm:text-right">
          <div>
            <dt className="text-xs text-slate-500">Visitas</dt>
            <dd className="text-2xl font-semibold leading-tight tabular-nums text-slate-900">{fmt(ficha.views)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Clics en botones</dt>
            <dd className="text-2xl font-semibold leading-tight tabular-nums text-slate-900">{fmt(ficha.clicks)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <SourceBar sources={ficha.sources} />
        {ficha.fewData && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            Aún pocos datos (menos de 30 visitas en 30 días): no saques conclusiones todavía.
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Tus enlaces</h3>
          {!composing && (
            <button type="button" onClick={() => setComposing(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-slate-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary">
              <Plus className="size-4" aria-hidden /> Crear enlace
            </button>
          )}
        </div>

        {ficha.links.length === 0 && !composing && (
          <p className="mt-2 text-sm text-slate-500">Crea un enlace para tu Instagram, WhatsApp o un afiche y mira cuánta gente llega por cada uno.</p>
        )}

        {ficha.links.length > 0 && (
          <ul className="mt-2 divide-y divide-gray-100">
            {ficha.links.map((l) => (
              <li key={l.code} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{l.label}</p>
                  <p className="truncate font-mono text-xs text-slate-500">{urlOf(l.code)}</p>
                </div>
                <p className="shrink-0 text-right text-sm tabular-nums text-slate-900"><span className="font-semibold">{fmt(l.clicks)}</span> <span className="text-xs text-slate-500">{l.clicks === 1 ? "clic" : "clics"}</span></p>
                <button type="button" onClick={() => copy(l.code)} aria-label={`Copiar enlace ${l.label}`} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-slate-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary">
                  {copied === l.code ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  {copied === l.code ? "Copiado" : "Copiar"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {composing && (
          <form onSubmit={create} className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-slate-600">¿Dónde lo vas a pegar?</legend>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p} type="button" aria-pressed={label === p} onClick={() => setLabel(p)} className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${label === p ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-slate-700 hover:bg-gray-100"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`label-${ficha.id}`}>Nombre del enlace (solo lo ves tú)</label>
              <input id={`label-${ficha.id}`} required maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="O ponle tu propio nombre" className="h-11 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-primary/30" />
              <div className="flex gap-2">
                <button type="submit" disabled={pending || !label.trim()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
                  {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Crear enlace
                </button>
                <button type="button" onClick={() => { setComposing(false); setLabel(""); }} className="h-11 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary">Cancelar</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </li>
  );
}
