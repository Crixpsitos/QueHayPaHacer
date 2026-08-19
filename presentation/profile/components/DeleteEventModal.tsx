"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { deleteEventAction } from "@/app/actions/events/delete-event.action";

interface DeleteEventModalProps {
  eventId: string;
  eventTitle: string;
  isPublished: boolean;
}

export function DeleteEventModal({ eventId, eventTitle, isPublished }: DeleteEventModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteEventAction(eventId);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-2 text-destructive transition-colors hover:bg-destructive/10"
        aria-label={`Eliminar evento: ${eventTitle}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Eliminar evento</DialogTitle>
            </div>
            <DialogDescription>
              Estás a punto de eliminar{" "}
              <span className="font-semibold text-foreground">"{eventTitle}"</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Antes de borrar el evento, ten en cuenta lo siguiente:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                El evento no se podrá recuperar una vez eliminado.
              </li>
              {isPublished && (
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  Perderás todas las analíticas acumuladas: vistas, clicks y compartidos.
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                Los registros de asistentes se eliminarán permanentemente.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                Los likes e interacciones de otros usuarios quedarán huérfanas hasta la próxima limpieza del sistema. Se recomienda notificar a los participantes antes de eliminar.
              </li>
            </ul>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-destructive/90 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isPending ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
