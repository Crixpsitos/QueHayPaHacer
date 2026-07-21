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

export function MultiDateProfessionalRequiredDialog() {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
            <CalendarClock className="h-6 w-6 text-violet-600 dark:text-violet-500" />
          </div>
          <DialogTitle>Función exclusiva para cuentas profesionales</DialogTitle>
          <DialogDescription>
            Los eventos multi-fecha (con varias sesiones) solo están disponibles
            para cuentas profesionales. Puedes crear un evento estándar, o
            solicitar una cuenta profesional desde tu perfil para desbloquear
            esta característica.
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
            onClick={() => router.push("/profile")}
            className="w-full font-semibold sm:w-auto"
          >
            Ir a mi perfil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
