import Link from "next/link";
import { FileWarning, Rocket } from "lucide-react";

interface DraftEventNoticeProps {
  eventId: string;
}

export function DraftEventNotice({ eventId }: DraftEventNoticeProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">Registros</h2>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-6 py-12 text-center">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
          <FileWarning className="h-5 w-5 text-amber-600" />
        </span>
        <p className="text-sm font-semibold text-amber-900">
          Este evento aún está en borrador
        </p>
        <p className="mt-1 max-w-sm text-xs text-amber-800">
          Todavía no se han podido recolectar datos ni registros porque el evento no se ha
          publicado. Publícalo para empezar a recibir inscripciones y ver analíticas.
        </p>
        <Link
          href={`/events/${eventId}/edit`}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Rocket className="h-4 w-4" />
          Ir a publicarlo
        </Link>
      </div>
    </div>
  );
}
