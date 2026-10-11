import type { UserPlan } from "@/domain/entities/user/User";

export interface MembershipFeature {
  id:
    | "create-events"
    | "basic-management"
    | "multi-date-events"
    | "custom-forms"
    | "attendance"
    | "studio"
    | "collaborators"
    | "priority-support";
  label: string;
  comingSoon?: boolean;
}

export interface MembershipPlanDefinition {
  id: UserPlan;
  label: string;
  description: string;
  /** COP/mes. null = gratis. */
  monthlyPriceCOP: number | null;
  features: MembershipFeature[];
}

/** Fase 1 (sin pasarela): Premium se activa a mano con scripts/set-user-plan.ts. */
export const PREMIUM_PRICE_COP = 50_000;
export const FOUNDER_LIMIT = 20;
export const FOUNDER_MONTHS = 3;

export const formatCOP = (value: number) =>
  `$ ${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value)}`;

/** Suma meses sin desbordar (31 ene + 1 mes = 28/29 feb). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}

export const MEMBERSHIP_PLANS: Record<UserPlan, MembershipPlanDefinition> = {
  basic: {
    id: "basic",
    label: "Básico",
    description: "Todo lo necesario para empezar a crear y gestionar tu actividad.",
    monthlyPriceCOP: null,
    features: [
      { id: "create-events", label: "Crear eventos y sitios" },
      { id: "basic-management", label: "Inscripciones y lista de inscritos" },
    ],
  },
  premium: {
    id: "premium",
    label: "Premium",
    description: "Herramientas avanzadas para creadores que quieren gestionar más.",
    monthlyPriceCOP: PREMIUM_PRICE_COP,
    features: [
      { id: "create-events", label: "Todo lo incluido en Básico" },
      { id: "multi-date-events", label: "Eventos multifecha" },
      { id: "custom-forms", label: "Formularios personalizados" },
      { id: "attendance", label: "Control de asistencia" },
      { id: "studio", label: "Studio y analíticas avanzadas" },
      { id: "collaborators", label: "Gestión de colaboradores" },
      { id: "priority-support", label: "Soporte prioritario" },
    ],
  },
};

export function getMembershipPlan(plan?: UserPlan): MembershipPlanDefinition {
  return MEMBERSHIP_PLANS[plan ?? "basic"];
}