"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { addGuestAction, type AddGuestResult } from "@/app/actions/events/add-guest.action";
import { notifyIncomeChanged } from "@/presentation/events/components/EventIncomeCard";
import { CopyButton } from "@/presentation/shared/components/CopyButton";
import type { PayTier } from "@/domain/entities/EventRegistration/payment";

const cop = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const input = "min-h-11 rounded-lg border border-gray-200 px-3 text-sm font-normal outline-none focus:border-[#9B0A26]";

/**
 * Agrega a mano a una persona SIN cuenta (se inscribió por WhatsApp o llega a la puerta) y le genera su entrada con QR. Es el
 * único lugar para hacerlo: la lista, el escáner y el CSV viven en la tabla de registros de Studio.
 */
export function AddGuestDialog({ eventId, tiers, trigger }: { eventId: string; tiers: PayTier[]; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState(() => [...tiers].sort((a, b) => a.amount - b.amount)[0]?.name ?? "");
  const [res, setRes] = useState<AddGuestResult | null>(null);

  const submit = async () => {
    setBusy(true);
    const r = await addGuestAction(eventId, { name, phone, email, tier: tiers.length ? tier : undefined });
    setBusy(false);
    setRes(r);
    if (r.success) { setName(""); setPhone(""); setEmail(""); notifyIncomeChanged(); router.refresh(); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setRes(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar persona sin cuenta</DialogTitle>
          <DialogDescription>Para quien se inscribió por WhatsApp o llega a la puerta. Le generamos su entrada con QR. El teléfono y el correo son datos personales: úsalos solo para enviarle su entrada.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-medium text-gray-700">Nombre<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ana María Ruiz" className={input} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-gray-700">WhatsApp (opcional)<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="300 123 4567" className={input} /></label>
            <label className="grid gap-1 text-xs font-medium text-gray-700">Correo (opcional)<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" placeholder="ana@correo.com" className={input} /></label>
          </div>
          {tiers.length > 1 ? (
            <label className="grid gap-1 text-xs font-medium text-gray-700">Categoría de la entrada
              <select value={tier} onChange={(e) => setTier(e.target.value)} className={`${input} bg-white`}>{tiers.map((t) => <option key={t.name} value={t.name}>{t.name} · {cop(t.amount)}</option>)}</select>
            </label>
          ) : null}
          <button type="button" disabled={busy || name.trim().length < 2} onClick={() => void submit()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#9B0A26] px-5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Crear entrada
          </button>
          {res && !res.success ? <p role="alert" className="text-xs font-medium text-red-600">{res.error}</p> : null}
          {res?.success ? (
            <div role="status" className="grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-900">Listo: {res.name} quedó inscrita.</p>
              <div className="flex flex-wrap gap-2">
                <a href={res.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#14532D] px-4 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" aria-hidden /> Enviar entrada por WhatsApp</a>
                <CopyButton text={res.url} label="Copiar enlace" />
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
