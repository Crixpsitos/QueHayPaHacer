import type { UserPlan } from "@/domain/entities/user/User";

export interface MembershipFeature {
  id:
    | "create-events"
    | "basic-management"
    | "multi-date-events"
    | "custom-forms"
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
  features: MembershipFeature[];
}

export const MEMBERSHIP_PLANS: Record<UserPlan, MembershipPlanDefinition> = {
  basic: {
    id: "basic",
    label: "Básico",
    description: "Todo lo necesario para empezar a crear y gestionar tu actividad.",
    features: [
      { id: "create-events", label: "Crear eventos" },
      { id: "basic-management", label: "Gestión básica de eventos" },
    ],
  },
  premium: {
    id: "premium",
    label: "Premium",
    description: "Herramientas avanzadas para creadores que quieren gestionar más.",
    features: [
      { id: "create-events", label: "Todo lo incluido en Básico" },
      { id: "multi-date-events", label: "Eventos multifecha" },
      { id: "custom-forms", label: "Formularios personalizados" },
      { id: "studio", label: "Studio y analíticas avanzadas" },
      { id: "collaborators", label: "Gestión de colaboradores" },
      { id: "priority-support", label: "Soporte prioritario", comingSoon: true },
    ],
  },
};

export function getMembershipPlan(plan?: UserPlan): MembershipPlanDefinition {
  return MEMBERSHIP_PLANS[plan ?? "basic"];
}