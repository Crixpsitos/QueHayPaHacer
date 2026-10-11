"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Loader2, MailPlus, X } from "lucide-react";
import { respondCollaboratorInvitationAction } from "@/app/actions/studio/respond-collaborator-invitation.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { notify } from "@/presentation/shared/lib/notify";
import type { InvitationVM } from "@/presentation/studio/view-models/StudioCollaboratorsViewModel";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export function MyInvitations({ initial }: { initial: InvitationVM[] }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<{ id: string; accept: boolean } | null>(null);
  const [acceptedNames, setAcceptedNames] = useState<string[]>([]);

  const respond = async (inv: InvitationVM, accept: boolean) => {
    setBusy({ id: inv.id, accept });
    const res = await respondCollaboratorInvitationAction(inv.id, accept);
    setBusy(null);
    if (!res.success) {
      notify.error(res.error ?? "No se pudo procesar la invitación.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== inv.id));
    if (accept) {
      setAcceptedNames((prev) => [...prev, inv.fromDisplayName]);
      notify.success(`Ahora colaboras con ${inv.fromDisplayName}.`);
    } else notify.success("Invitación rechazada.");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-zinc-950">Mis invitaciones</h1>
        <p className="text-sm text-zinc-500 sm:text-base">
          Quien te invita podrá acreditarte como parte del equipo de sus eventos.
        </p>
      </header>

      {acceptedNames.length > 0 && (
        <p role="status" className="rounded-2xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-zinc-700">
          Ahora puedes aparecer como colaborador en sus eventos. Gestiona tus eventos en{" "}
          <Link href="/mis-eventos" className="font-medium text-[#E63946] underline-offset-4 hover:underline">
            Mis eventos
          </Link>
          .
        </p>
      )}

      <ul className="space-y-3" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((inv) => {
            const isBusy = busy?.id === inv.id;
            return (
              <motion.li
                key={inv.id}
                layout={!reduce}
                initial={false}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="size-11 border border-[#E4E4E7]">
                      <AvatarImage src={inv.fromPhotoURL} alt="" />
                      <AvatarFallback className="bg-zinc-100 text-sm font-semibold text-zinc-700">
                        {inv.fromDisplayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-heading text-base font-semibold text-zinc-950">
                        <span className="break-words">{inv.fromDisplayName}</span> te invitó a colaborar
                      </p>
                      <p className="text-xs text-zinc-500">{formatDate(inv.invitedAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-zinc-950 text-white hover:bg-[#E63946] sm:flex-none"
                      disabled={isBusy}
                      onClick={() => void respond(inv, true)}
                    >
                      {isBusy && busy?.accept ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                      Aceptar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      disabled={isBusy}
                      onClick={() => void respond(inv, false)}
                    >
                      {isBusy && !busy?.accept ? <Loader2 className="animate-spin" aria-hidden="true" /> : <X aria-hidden="true" />}
                      Rechazar
                    </Button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E4E4E7] bg-white px-6 py-12 text-center">
          <MailPlus className="mx-auto size-8 text-zinc-400" aria-hidden="true" />
          <p className="mt-3 font-heading text-lg font-semibold text-zinc-950">No tienes invitaciones pendientes</p>
        </div>
      )}
    </div>
  );
}
