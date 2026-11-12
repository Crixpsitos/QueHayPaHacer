"use client";

import { useCallback, useEffect, useState } from "react";
import { getEventIncomeAction } from "@/app/actions/events/get-event-income.action";
import type { IncomeSummary } from "@/domain/entities/EventRegistration/payment";

export const INCOME_EVENT = "qhpa:income";
/** Avisa a las tarjetas de ingresos abiertas que alguien se confirmó (botón, QR o lote). */
export const notifyIncomeChanged = () => typeof window !== "undefined" && window.dispatchEvent(new Event(INCOME_EVENT));

const cop = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

/** Cuánto ha entrado y por cuál categoría, entre las personas confirmadas. Se actualiza solo cuando se confirma a alguien. */
export function EventIncomeCard({ eventId }: { eventId: string }) {
  const [income, setIncome] = useState<IncomeSummary | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const r = await getEventIncomeAction(eventId);
    if (r.success) { setIncome(r.income); setFailed(false); } else setFailed(true);
  }, [eventId]);

  useEffect(() => {
    void load();
    window.addEventListener(INCOME_EVENT, load);
    return () => window.removeEventListener(INCOME_EVENT, load);
  }, [load]);

  if (failed) return null;
  const top = income?.byTier[0];
  return (
    <section aria-label="Ingresos del evento" className="rounded-2xl border border-[#F6DDA0] bg-[#FFF8E7] p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#7a5200]">Ha entrado</p>
          <p className="font-heading text-2xl font-extrabold text-[#6E0A1D]" aria-live="polite">{income ? cop(income.total) : "…"}</p>
        </div>
        {income && income.paidCount > 0 && (
          <p className="text-xs text-[#7a5200]">{income.paidCount} {income.paidCount === 1 ? "persona confirmada" : "personas confirmadas"} con pago</p>
        )}
      </div>
      {income && income.paidCount === 0 && <p className="mt-2 text-xs text-[#7a5200]">Aún no hay pagos confirmados. Confirma a cada persona cuando pague o escanea su QR al llegar.</p>}
      {income && income.byTier.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {income.byTier.map((t) => (
            <li key={t.tier} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-zinc-800">
                {t.tier}
                {t === top && t.count > 0 && income.byTier.length > 1 && <span className="ml-2 rounded-full bg-[#FFB703] px-2 py-0.5 text-[11px] font-bold text-[#5C0011]">Categoría más alta</span>}
              </span>
              <span className="shrink-0 text-zinc-700">{t.count === 0 ? <>Sin pagos · {cop(t.unit)}</> : <>{t.count} × {cop(t.unit)} = <strong>{cop(t.amount)}</strong></>}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
