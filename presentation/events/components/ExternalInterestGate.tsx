"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

export type InterestGate = { kind: "tier" } | { kind: "waitlist"; position: number | null } | null;

interface Props {
  gate: InterestGate;
  tiers: { name: string; amount: number }[];
  money: (amount: number) => string;
  onPick: (tier: string) => void;
  onClose: () => void;
}

/**
 * Antes de ir al enlace externo: elegir la categoría de entrada (si el evento tiene varias) o, con el cupo lleno, el aviso de la
 * lista de espera. Es solo una intención: quien organiza confirma quién fue o pagó.
 */
export function ExternalInterestGate({ gate, tiers, money, onPick, onClose }: Props) {
  return (
    <Dialog open={gate !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {gate?.kind === "tier" ? (
          <>
            <DialogHeader>
              <DialogTitle>¿Qué entrada quieres?</DialogTitle>
              <DialogDescription>Elige la categoría. Luego te llevamos al enlace del evento para completar la inscripción.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              {tiers.map((t) => (
                <button key={t.name} type="button" onClick={() => onPick(t.name)} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[#E4E4E7] bg-white px-4 text-left font-semibold outline-none transition-colors hover:border-[#9B0A26] focus-visible:ring-3 focus-visible:ring-[#9B0A26]/30">
                  <span>{t.name}</span>
                  <span className="text-[#9B0A26]">{money(t.amount)}</span>
                </button>
              ))}
            </div>
          </>
        ) : gate?.kind === "waitlist" ? (
          <>
            <DialogHeader>
              <DialogTitle>Los cupos están completos</DialogTitle>
              <DialogDescription>
                Quedaste en la lista de espera{gate.position ? `, en el puesto ${gate.position}` : ""}. Si se libera un cupo, tu lugar pasa a «interesado» y quien organiza te puede confirmar. No hace falta que hagas nada más.
              </DialogDescription>
            </DialogHeader>
            <button type="button" onClick={onClose} className="min-h-12 rounded-full bg-[#9B0A26] px-6 font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-[#9B0A26]/40">Entendido</button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
