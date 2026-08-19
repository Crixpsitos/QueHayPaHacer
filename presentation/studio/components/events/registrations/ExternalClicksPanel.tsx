import { ExternalLink, MousePointerClick } from "lucide-react";

interface ExternalClicksPanelProps {
  clicks: number;
  url?: string;
}

const formatNumber = (n: number) => n.toLocaleString("es-CO");

export function ExternalClicksPanel({ clicks, url }: ExternalClicksPanelProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">Registro externo</h2>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <MousePointerClick className="h-3.5 w-3.5" />
          Clicks al botón de registro
        </p>
        <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-slate-900">
          {formatNumber(clicks)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Personas que pulsaron &quot;Registrarse&quot; para ir al sitio externo. El registro ocurre
          fuera de la plataforma, por eso no hay lista de inscritos.
        </p>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="max-w-[260px] truncate">{url}</span>
          </a>
        )}
      </div>
    </div>
  );
}
