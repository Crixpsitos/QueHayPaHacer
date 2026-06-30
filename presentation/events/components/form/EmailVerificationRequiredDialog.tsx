"use client";

import { MailWarning } from "lucide-react";
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

export function EmailVerificationRequiredDialog() {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <MailWarning className="h-6 w-6 text-amber-600 dark:text-amber-500" />
          </div>
          <DialogTitle>Verifica tu correo para crear eventos</DialogTitle>
          <DialogDescription>
            Por seguridad, solo los usuarios con el correo electrónico verificado pueden publicar eventos
            en la plataforma. Ve a tu perfil para reenviar el correo de verificación.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => router.push("/profile")} className="w-full font-semibold sm:w-auto">
            Ir a mi perfil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
