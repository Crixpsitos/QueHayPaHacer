import Link from "next/link"
import { CalendarDays } from "lucide-react"

/** Acceso a «Mis planes» desde un evento o un sitio: lo que marcas con «Voy a ir» o «Me gusta» entra solo a tu semana. */
export function PlanLink({ kind, className }: { kind: "event" | "site"; className?: string }) {
  return (
    <Link
      href="/mis-planes"
      prefetch={false}
      title={kind === "event" ? "Con «Voy a ir» el evento entra a tu semana por su día y hora" : "Con «Me gusta» el sitio queda en tu plan como lugar para visitar"}
      className={className ?? "inline-flex h-11 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-semibold text-primary-dark outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/40"}
    >
      <CalendarDays className="size-4" aria-hidden /> Armar mi plan
    </Link>
  )
}
