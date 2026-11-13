import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Link2,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export interface StudioNavItem {
  label: string;
  /** Texto corto para la barra inferior del móvil. */
  short: string;
  href: string;
  icon: LucideIcon;
  /** Coincidencia exacta de ruta (para el item "Resumen"). */
  exact?: boolean;
}

export const STUDIO_NAV: StudioNavItem[] = [
  { label: "Resumen", short: "Resumen", href: "/studio", icon: LayoutDashboard, exact: true },
  { label: "Mis eventos", short: "Eventos", href: "/studio/events", icon: CalendarDays },
  { label: "Visitas y enlaces", short: "Visitas", href: "/studio/links", icon: Link2 },
  { label: "Colaboradores", short: "Equipo", href: "/studio/collaborators", icon: Users },
  { label: "Soporte prioritario", short: "Soporte", href: "/studio/support", icon: LifeBuoy },
];

/** Modo limitado (miembro de equipo sin Premium propio): solo los eventos donde participa. */
export const STUDIO_NAV_LIMITED: StudioNavItem[] = [
  { label: "Eventos del equipo", short: "Eventos", href: "/studio/events", icon: CalendarDays },
]

/** Devuelve la etiqueta de sección activa a partir del pathname (para breadcrumb). */
export const getActiveSectionLabel = (pathname: string, limited = false): string => {
  const match = [...(limited ? STUDIO_NAV_LIMITED : STUDIO_NAV)]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href),
    );
  return match?.label ?? (limited ? "Eventos del equipo" : "Resumen");
};
