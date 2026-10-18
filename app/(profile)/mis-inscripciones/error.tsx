"use client";

import { Container } from "@/app/components/layout/shared/Container";
import { Button } from "@/app/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-8 sm:py-12">
      <div role="alert" className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <p className="font-heading text-lg font-semibold">No pudimos cargar tus inscripciones</p>
        <p className="mt-1 text-sm text-muted-foreground">Intenta de nuevo en unos segundos.</p>
        <Button className="mt-5" variant="outline" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </Container>
  );
}
