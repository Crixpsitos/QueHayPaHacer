"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils/cn";
import { STUDIO_NAV } from "../lib/navigation";

/**
 * Barra inferior del Estudio en el celular: el menú lateral solo existe desde `lg`, y sin esto no había cómo pasar de «Mis eventos»
 * a «Visitas y enlaces» (ni a nada) en móvil. Cinco destinos con icono y texto, objetivos táctiles de 56 px.
 * En modo limitado (un solo destino) no se muestra: no hay a dónde ir.
 */
export function StudioMobileNav({ limited = false }: { limited?: boolean }) {
  const pathname = usePathname();
  if (limited) return null;
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Estudio" className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {STUDIO_NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium outline-none focus-visible:bg-gray-100", active ? "text-primary" : "text-slate-500")}
              >
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-primary-light")}>
                  <item.icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {item.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
