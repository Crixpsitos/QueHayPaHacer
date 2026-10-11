import {
  LayoutDashboard,
  CalendarDays,
  MapPin,
  Users,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export interface StudioNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Coincidencia exacta de ruta (para el item "Resumen"). */
  exact?: boolean;
}

export const STUDIO_NAV: StudioNavItem[] = [
  { label: "Resumen", href: "/studio", icon: LayoutDashboard, exact: true },
  { label: "Mis eventos", href: "/studio/events", icon: CalendarDays },
  { label: "Sitios", href: "/studio/sites", icon: MapPin },
  { label: "Colaboradores", href: "/studio/collaborators", icon: Users },
  { label: "Soporte prioritario", href: "/studio/support", icon: LifeBuoy },
];

/** Modo limitado (miembro de equipo sin Premium propio): solo los eventos donde participa. */
export const STUDIO_NAV_LIMITED: StudioNavItem[] = [
  { label: "Eventos del equipo", href: "/studio/events", icon: CalendarDays },
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
