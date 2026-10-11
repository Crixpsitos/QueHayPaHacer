"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";

export default function StudioError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[studio error]", error.digest ?? error.name);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white p-6">
      <p className="font-semibold text-slate-900">No pudimos cargar esta sección del Estudio</p>
      <p className="text-sm text-slate-500">Tus datos no se modificaron. Intenta de nuevo en unos segundos.</p>
      <Button onClick={() => retry()}>Intentar de nuevo</Button>
    </div>
  );
}
