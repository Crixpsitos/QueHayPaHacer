"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag } from "lucide-react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { cn } from "@/app/lib/utils/cn";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  REPORT_DETAILS_MAX,
  REPORT_OTHER_DETAILS_MIN,
  REPORT_REASONS,
  type ReportTargetType,
} from "@/domain/entities/report/Report";
import { reportContentAction } from "@/app/actions/report/report-content.action";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  sessionId?: string;
  /** El autor no ve el botón. */
  isOwner?: boolean;
  /** Alternativa a isOwner cuando el servidor no lo calcula: se compara con la sesión del cliente. */
  authorId?: string;
  className?: string;
}

const triggerClass =
  "inline-flex items-center gap-1.5 text-sm text-[#71717A] transition-colors hover:text-[#09090B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C]/40 rounded";

const ctaClass = "rounded-xl bg-[#D42F3C] px-5 text-white hover:bg-[#D42F3C]/90";

export function ReportButton({ targetType, targetId, sessionId, isOwner = false, authorId, className }: ReportButtonProps) {
  const { user, isHydrating } = useAuth();
  const pathname = usePathname();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (isHydrating || isOwner || (user && user.uid === authorId)) return null;

  if (!user) {
    return (
      <Link href={`/login?redirect_to=${encodeURIComponent(pathname)}`} className={cn(triggerClass, className)}>
        <Flag className="size-3.5" aria-hidden />
        Reportar
      </Link>
    );
  }

  const noun = targetType === "event" ? "evento" : "sitio";
  const needsDetails = reason === "other";
  const trimmed = details.trim();
  const canSubmit =
    !!reason && trimmed.length <= REPORT_DETAILS_MAX && (!needsDetails || trimmed.length >= REPORT_OTHER_DETAILS_MIN);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reinicia al cerrar para que un nuevo intento empiece limpio.
      setReason("");
      setDetails("");
      setError(null);
      setDone(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await reportContentAction({ targetType, targetId, sessionId, reason, details: trimmed });
      if (res.success) setDone(true);
      else setError(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className={cn(triggerClass, className)}>
        <Flag className="size-3.5" aria-hidden />
        Reportar
      </DialogTrigger>
      <DialogContent className="rounded-2xl border border-[#E4E4E7] bg-white text-[#09090B]">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-semibold">Reporte enviado</DialogTitle>
              <DialogDescription className="text-[#52525B]">Gracias. Revisaremos este reporte.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button className={ctaClass}>Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="grid gap-5">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-semibold">Reportar este {noun}</DialogTitle>
              <DialogDescription className="text-[#52525B]">
                Cuéntanos qué está mal. Tu reporte es confidencial.
              </DialogDescription>
            </DialogHeader>

            <RadioGroup
              value={reason}
              onValueChange={setReason}
              aria-label="Motivo del reporte"
              disabled={pending}
              className="gap-2.5"
            >
              {REPORT_REASONS[targetType].map((r) => (
                <div key={r.value} className="flex items-center gap-3">
                  <RadioGroupItem
                    value={r.value}
                    id={`${ids}-${r.value}`}
                    className="border-[#E4E4E7] bg-white data-checked:border-[#D42F3C] data-checked:bg-[#D42F3C]"
                  />
                  <Label htmlFor={`${ids}-${r.value}`} className="cursor-pointer text-sm font-normal text-[#09090B]">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="grid gap-1.5">
              <Label htmlFor={`${ids}-details`} className="text-sm font-medium text-[#09090B]">
                Detalles {needsDetails ? "" : <span className="font-normal text-[#71717A]">(opcional)</span>}
              </Label>
              <Textarea
                id={`${ids}-details`}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={REPORT_DETAILS_MAX}
                rows={3}
                disabled={pending}
                required={needsDetails}
                aria-describedby={`${ids}-details-hint`}
                placeholder={needsDetails ? "Describe el problema" : "Agrega información que nos ayude a revisarlo"}
                className="min-h-20 border-[#E4E4E7] bg-white"
              />
              <p id={`${ids}-details-hint`} className="text-xs text-[#71717A]">
                {needsDetails && trimmed.length < REPORT_OTHER_DETAILS_MIN
                  ? `Mínimo ${REPORT_OTHER_DETAILS_MIN} caracteres.`
                  : `${trimmed.length}/${REPORT_DETAILS_MAX}`}
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#D42F3C]">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={!canSubmit || pending} className={ctaClass}>
                {pending ? "Enviando…" : "Enviar reporte"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
