"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { notify } from "@/presentation/shared/lib/notify";
import { createLinkAction } from "@/app/actions/studio/create-link.action";

export interface LinkTargetOption { type: "event" | "site"; id: string; name: string }
export interface LinkItem { code: string; label: string; targetType: "event" | "site"; targetName: string; clicks: number }

const FIELD =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-primary/30";

export function LinksView({ baseUrl, links, events, sites }: { baseUrl: string; links: LinkItem[]; events: LinkTargetOption[]; sites: LinkTargetOption[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [target, setTarget] = useState("");
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const hasTargets = events.length + sites.length > 0;
  const urlOf = (code: string) => `${baseUrl}/r/${code}`;

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const [targetType, targetId] = target.split(":");
    startTransition(async () => {
      const res = await createLinkAction({ label, targetType, targetId });
      if (!res.success) return notify.error(res.error);
      notify.success("Enlace creado.");
      setLabel("");
      router.refresh();
      void copy(res.code);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis enlaces</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Crea un enlace distinto para cada lugar donde publiques tu evento o sitio: tu Instagram, tus historias, un afiche con QR.
          Así sabrás cuántas personas entran por cada uno.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Link2 className="h-4 w-4 text-slate-400" aria-hidden /> Nuevo enlace
        </h2>
        {hasTargets ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="link-target" className="mb-1 block text-xs font-medium text-slate-600">¿A qué lleva?</label>
              <select id="link-target" required value={target} onChange={(e) => setTarget(e.target.value)} className={FIELD}>
                <option value="" disabled>Elige un evento o sitio</option>
                {events.length > 0 && (
                  <optgroup label="Eventos">{events.map((t) => <option key={t.id} value={`event:${t.id}`}>{t.name}</option>)}</optgroup>
                )}
                {sites.length > 0 && (
                  <optgroup label="Sitios">{sites.map((t) => <option key={t.id} value={`site:${t.id}`}>{t.name}</option>)}</optgroup>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="link-label" className="mb-1 block text-xs font-medium text-slate-600">Etiqueta (solo la ves tú)</label>
              <input id="link-label" required maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Instagram de Nebraska" className={FIELD} />
            </div>
            <button
              type="submit"
              disabled={pending || !label.trim() || !target}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Crear enlace
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Primero publica un evento o un sitio: los enlaces se crean sobre uno de ellos.</p>
        )}
      </form>

      {links.length === 0 ? (
        hasTargets && <div role="status" className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm font-medium text-slate-900">Aún no tienes enlaces</p>
          <p className="mt-1 text-sm text-slate-500">Crea el primero y pégalo en tu biografía de Instagram para ver cuánta gente llega desde allí.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {links.map((l) => (
            <li key={l.code} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 sm:w-56 sm:shrink-0">
                <p className="truncate text-sm font-semibold text-slate-900">{l.label}</p>
                <p className="truncate text-xs text-slate-500">{l.targetType === "event" ? "Evento" : "Sitio"} · {l.targetName}</p>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input readOnly value={urlOf(l.code)} aria-label={`Enlace de ${l.label}`} onFocus={(e) => e.currentTarget.select()} className={`${FIELD} font-mono text-xs`} />
                <button
                  type="button"
                  onClick={() => copy(l.code)}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                >
                  {copied === l.code ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  {copied === l.code ? "Copiado" : "Copiar"}
                </button>
              </div>
              <div className="shrink-0 sm:w-24 sm:text-right">
                <p className="text-lg font-semibold tabular-nums text-slate-900">{l.clicks.toLocaleString("es-CO")}</p>
                <p className="text-xs text-slate-500">{l.clicks === 1 ? "clic" : "clics"} en 30 días</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-400" aria-live="polite">
        {copied ? "Enlace copiado al portapapeles. " : ""}Los clics son un mínimo: una misma persona cuenta una vez al día por enlace.
      </p>
    </div>
  );
}
