import type { LinksOverview } from "@/presentation/studio/lib/linksOverview";
import { FichaCardView } from "./FichaCardView";

const fmt = (n: number) => n.toLocaleString("es-CO");

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0">
      <dd className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-slate-900 sm:text-4xl">{fmt(value)}</dd>
      <dt className="mt-1.5 text-xs text-slate-500 sm:text-sm">{label}</dt>
    </div>
  );
}

/** Panel "Visitas y enlaces": resumen de 30 días + una tarjeta por ficha publicada (visitas, origen y enlaces propios). */
export function LinksView({ baseUrl, overview }: { baseUrl: string; overview: LinksOverview }) {
  const { fichas, totals } = overview;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visitas y enlaces</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Mira cuánta gente llega a tus eventos y sitios, de dónde viene y cuál de tus enlaces funciona mejor. Últimos 30 días.
        </p>
      </div>

      {fichas.length === 0 ? (
        <div role="status" className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm font-medium text-slate-900">Aún no tienes nada publicado</p>
          <p className="mt-1 text-sm text-slate-500">Cuando publiques un evento o un sitio, aquí verás sus visitas y podrás crear enlaces para tus redes.</p>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <Stat value={totals.views} label="visitas" />
            <Stat value={totals.clicks} label="clics en botones" />
            <Stat value={totals.linkClicks} label="clics en tus enlaces" />
          </dl>
          <ul className="space-y-4">
            {fichas.map((f) => <FichaCardView key={`${f.type}:${f.id}`} ficha={f} baseUrl={baseUrl} />)}
          </ul>
        </>
      )}
      <p className="text-xs text-slate-400">
        Son cifras mínimas: una misma persona cuenta una vez al día. El origen suma visitas y clics. Muestra tus 25 eventos y 25 sitios publicados más recientes.
      </p>
    </div>
  );
}
