"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Solo el digest: el mensaje puede traer datos del servidor.
    console.error("[route error]", error.digest ?? error.name);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground/80">
        <TriangleAlert className="h-9 w-9 text-foreground/80" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">No pudimos cargar esta página</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Fue un error de nuestro lado. Intenta de nuevo en unos segundos.
        </p>
      </div>
      <Button className="mt-2" onClick={() => retry()}>
        Intentar de nuevo
      </Button>
    </main>
  );
}
