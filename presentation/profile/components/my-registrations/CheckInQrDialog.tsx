"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { EASE_OUT } from "@/app/components/motion/primitives";
import { QRCodeSVG } from "qrcode.react";
import { getMyCheckInCodeAction, type MyCheckInCodeResult } from "@/app/actions/events/get-my-check-in-code.action";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import type { UserRegistrationItem } from "@/domain/entities/EventRegistration/myRegistrations";
import { formatTimeRange } from "@/presentation/events/components/detail/format";

/** Código QR de check-in de una inscripción. Se pide al abrir (se crea de forma perezosa en el servidor). */
export function CheckInQrDialog({ target, onClose }: { target: UserRegistrationItem | null; onClose: () => void }) {
  // `done` guarda la clave de lo ya resuelto: mientras no coincida con `target`, se muestra "cargando".
  const [done, setDone] = useState<{ key: string; res: MyCheckInCodeResult } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const still = useReducedMotion();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin portapapeles: el código sigue visible para dictarlo */
    }
  };
  const key = target ? `${target.eventId}/${target.sessionId ?? ""}/${attempt}` : "";

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    getMyCheckInCodeAction({ eventId: target.eventId, sessionId: target.sessionId })
      .catch((): MyCheckInCodeResult => ({ error: "No se pudo generar tu código. Intenta nuevamente." }))
      .then((res) => !cancelled && setDone({ key, res }));
    return () => {
      cancelled = true;
    };
  }, [target, key]);

  const res = done?.key === key ? done.res : null;

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Tu código de entrada</DialogTitle>
          <DialogDescription>
            {target?.title}
            {target && (
              <>
                <br />
                <time dateTime={target.startDate}>{formatTimeRange(target.startDate, target.endDate)}</time>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4" aria-live="polite">
          {!res && (
            <div role="status" className="flex h-60 w-60 items-center justify-center rounded-2xl bg-[#F4F4F5] text-sm text-[#71717A]">
              Generando tu código…
            </div>
          )}

          {res?.error && (
            <div className="space-y-3 text-center">
              <p role="alert" className="text-sm text-[#D42F3C]">{res.error}</p>
              {!res.authRequired && (
                <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
                  Reintentar
                </Button>
              )}
            </div>
          )}

          {res?.payload && res.code && (
            <>
              <motion.div
                className="rounded-2xl border border-[#E4E4E7] bg-white p-4"
                initial={still ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
              >
                <QRCodeSVG
                  value={res.payload}
                  size={240}
                  level="M"
                  marginSize={2}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  title={`Código QR de entrada para ${res.title ?? target?.title}`}
                />
              </motion.div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => copyCode(res.code!)}
                  aria-label={`Copiar código ${res.code}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-heading text-2xl font-bold tracking-widest text-[#09090B] tabular-nums transition-colors hover:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C]"
                >
                  {res.code}
                  {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4 text-[#71717A]" aria-hidden="true" />}
                </button>
                <span role="status" aria-live="polite" className="sr-only">{copied ? "Código copiado" : ""}</span>
                <p className="mt-1 text-sm text-[#52525B]">Si el escáner falla, dicta este código.</p>
              </div>
              <p className="text-center text-sm text-[#71717A]">Muéstralo al organizador en la entrada.</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
