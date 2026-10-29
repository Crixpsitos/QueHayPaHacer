import { CalendarDays, CloudRain } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"
import {
  HOLIDAY_POLICY_LABELS, RAIN_POLICY_LABELS, type SiteOpeningPolicy,
} from "@/domain/entities/sites/value-objects/SiteOpeningPolicy"
import type { SiteOpenStatus } from "../../lib/openStatus"

/**
 * Qué hace el sitio en festivos y con lluvia, y un aviso si hoy es festivo. Sin dato se dice que no está
 * confirmado (no se asume que abre ni que cierra).
 */
export function OpeningPolicyNotes({
  policy, status, className,
}: {
  policy?: SiteOpeningPolicy
  status?: Pick<SiteOpenStatus, "holiday"> | null
  className?: string
}) {
  const h = policy?.holidays
  const r = policy?.rain
  const holidayText = !h
    ? "Sin confirmar"
    : h.policy === "custom"
      ? `Abre ${h.open} – ${h.close}`
      : HOLIDAY_POLICY_LABELS[h.policy]
  const today = status?.holiday

  return (
    <div className={cn("space-y-2 text-sm", className)}>
      {today && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800" role="status">
          Hoy es festivo ({today.name}).{" "}
          {today.policy === null && "Este sitio no ha confirmado si abre; confírmalo antes de ir."}
        </p>
      )}
      <div className="flex items-start gap-2 text-[#52525B]">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#D42F3C]" aria-hidden />
        <p><span className="font-medium text-[#09090B]">Festivos:</span> {holidayText}</p>
      </div>
      <div className="flex items-start gap-2 text-[#52525B]">
        <CloudRain className="mt-0.5 size-4 shrink-0 text-[#D42F3C]" aria-hidden />
        <p>
          <span className="font-medium text-[#09090B]">Si llueve:</span>{" "}
          {r ? RAIN_POLICY_LABELS[r.policy] : "Sin confirmar"}
          {r?.note && <span className="block text-xs text-[#71717A] [overflow-wrap:anywhere]">{r.note}</span>}
        </p>
      </div>
    </div>
  )
}
