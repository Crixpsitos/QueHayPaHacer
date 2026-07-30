import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground/80">
        <Compass className="h-9 w-9 text-foreground/80" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">Página no encontrada</p>
        <p className="max-w-md text-sm text-muted-foreground">
          La página que buscas no existe o cambió de dirección.
        </p>
      </div>
      <Button asChild className="mt-2">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
