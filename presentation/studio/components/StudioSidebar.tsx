"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { SPRING_SNAPPY } from "@/app/components/motion/primitives";
import { STUDIO_NAV, STUDIO_NAV_LIMITED } from "../lib/navigation";

interface StudioSidebarProps {
  premiumLabel: string;
  /** Modo equipo sin Premium propio: solo "Eventos del equipo" y acceso a conocer Premium. */
  limited?: boolean;
}

export function StudioSidebar({ premiumLabel, limited = false }: StudioSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50/60 lg:flex">
      <nav className="flex-1 space-y-1 p-3">
        {(limited ? STUDIO_NAV_LIMITED : STUDIO_NAV).map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
                active ? "text-primary" : "text-slate-600 hover:bg-gray-100 hover:text-slate-900",
              )}
            >
              {active && (
                <motion.span
                  layoutId="studio-nav-active"
                  aria-hidden
                  className="absolute inset-0 rounded-lg bg-primary-light"
                  transition={SPRING_SNAPPY}
                />
              )}
              <item.icon
                className={cn("relative h-[18px] w-[18px]", active ? "text-primary" : "text-slate-400")}
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-gray-200">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-400">
              Cuenta
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">{limited ? "Colaborador" : premiumLabel}</p>
            {limited && (
              <Link href="/premium" className="text-xs font-medium text-primary hover:underline">
                Conocer Premium
              </Link>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
