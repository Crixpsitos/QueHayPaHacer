/** Estado vacío común de las gráficas del Estudio (sin datos ≠ error). */
export function ChartEmpty({ height = 300 }: { height?: number }) {
  return (
    <div
      style={{ height }}
      className="flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-50 text-center"
    >
      <p className="text-sm font-medium text-slate-500">Sin datos aún</p>
      <p className="text-xs text-slate-400">Aparecerán cuando tus eventos reciban actividad.</p>
    </div>
  );
}
