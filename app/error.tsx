"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { unstable_isUnrecognizedActionError } from "next/navigation";
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

  // Pestaña abierta con una versión anterior al despliegue: recargar lo arregla (no es un fallo de la página).
  const stale = unstable_isUnrecognizedActionError(error);

  return (
    <main className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-20 w-20 animate-in zoom-in-90 duration-300 motion-reduce:animate-none items-center justify-center rounded-full border-2 border-foreground/80">
        <TriangleAlert className="h-9 w-9 text-foreground/80" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">
          {stale ? "Hay una versión nueva de la app" : "No pudimos cargar esta página"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {stale
            ? "Esta pestaña quedó con la versión anterior. Recarga la página para seguir."
            : "Fue un error de nuestro lado. Intenta de nuevo en unos segundos."}
        </p>
      </div>
      <Button className="mt-2" onClick={() => (stale ? window.location.reload() : retry())}>
        {stale ? "Recargar la página" : "Intentar de nuevo"}
      </Button>
    </main>
  );
}
