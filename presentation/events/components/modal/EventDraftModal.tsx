"use client";

import { useRouter } from "next/navigation";
import { useEventModalStore } from "@/presentation/events/store/useEventModalStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button/button";
import { FileEdit, Plus } from "lucide-react";

interface EventDraftModalProps {
  draftId: string;
}

export const EventDraftModal = ({ draftId }: EventDraftModalProps) => {
  const router = useRouter();
  const { isOpen, setIsOpen } = useEventModalStore();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleContinue = () => {
    handleClose();
    router.push(`/eventos/${draftId}/edit`);
  };

  const handleCreateNew = () => {
    handleClose();
    router.push("/eventos/create?isNew=true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Tienes un borrador pendiente</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Hemos encontrado un evento que no terminaste de publicar. ¿Qué te gustaría hacer?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full justify-start gap-3 h-14 text-left border-zinc-200 dark:border-zinc-800"
            variant="outline"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <FileEdit className="size-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <p className="text-sm font-medium">Continuar editando</p>
              <p className="text-xs text-zinc-500">Retomar el borrador anterior</p>
            </div>
          </Button>

          <Button
            onClick={handleCreateNew}
            className="w-full justify-start gap-3 h-14 text-left border-zinc-200 dark:border-zinc-800"
            variant="outline"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Plus className="size-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <p className="text-sm font-medium">Empezar de cero</p>
              <p className="text-xs text-zinc-500">Crear un evento completamente nuevo</p>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full text-zinc-500 hover:text-zinc-900"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};