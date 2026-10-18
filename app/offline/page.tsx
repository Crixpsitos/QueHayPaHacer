import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

/**
 * Fallback offline: public/sw.js la precachea al instalarse y la sirve cuando
 * una navegación falla sin copia en caché. Debe seguir siendo 100% estática.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <WifiOff className="h-9 w-9 text-primary" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-foreground">Sin conexión</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          No pudimos cargar esta página. Revisa tu conexión a internet e inténtalo de nuevo.
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        {/* <a> nativo: recarga completa de la URL actual, que vuelve a pasar por la red. */}
        <Button asChild>
          <a href="">Reintentar</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/">Ir al inicio</a>
        </Button>
      </div>
    </main>
  );
}
