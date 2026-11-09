import Link from "next/link";
import { PERIODS, type Period } from "@/presentation/studio/lib/panelModel";
import { cn } from "@/app/lib/utils/cn";

export function PeriodTabs({ period, selectedKey }: { period: Period; selectedKey: string | null }) {
  return (
    <nav aria-label="Período" className="flex gap-1 rounded-[10px] bg-slate-200 p-1">
      {PERIODS.map((p) => (
        <Link
          key={p}
          href={`?${selectedKey ? `f=${encodeURIComponent(selectedKey)}&` : ""}d=${p}`}
          scroll={false}
          aria-current={p === period ? "page" : undefined}
          className={cn("flex min-h-11 items-center rounded-[7px] px-4 text-sm focus-visible:outline-2 focus-visible:outline-primary", p === period ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
        >
          {p} días
        </Link>
      ))}
    </nav>
  );
}
