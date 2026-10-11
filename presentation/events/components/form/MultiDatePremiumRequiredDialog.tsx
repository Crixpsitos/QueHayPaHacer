"use client";

import { CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export function MultiDatePremiumRequiredDialog() {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#E63946]/10">
            <CalendarClock className="h-6 w-6 text-[#E63946]" />
          </div>
          <DialogTitle>Función exclusiva del plan Premium</DialogTitle>
          <DialogDescription>
            Los eventos multifecha con varias sesiones están disponibles con el
            plan Premium. Puedes crear un evento estándar o conocer Premium.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/eventos/create?type=standard")}
            className="w-full font-semibold sm:w-auto"
          >
            Crear evento estándar
          </Button>
          <Button
            onClick={() => router.push("/premium")}
            className="w-full font-semibold sm:w-auto"
          >
            Conocer Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
