"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { STUDIO_NAV } from "../lib/navigation";

interface StudioSidebarProps {
  professionalLabel: string;
}

export function StudioSidebar({ professionalLabel }: StudioSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50/60 lg:flex">
      <nav className="flex-1 space-y-1 p-3">
        {STUDIO_NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-gray-100 hover:text-slate-900",
              )}
            >
              <item.icon
                className={cn("h-[18px] w-[18px]", active ? "text-indigo-600" : "text-slate-400")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-gray-200">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Cuenta
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">{professionalLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
