import { Info } from "lucide-react";

export function EmptyRegistrations() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">Registros</h2>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
          <Info className="h-5 w-5 text-slate-400" />
        </span>
        <p className="text-sm font-medium text-slate-700">Este evento no maneja registros</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          Es un evento informativo. No hay lista de inscritos porque no requiere registro.
        </p>
      </div>
    </div>
  );
}
