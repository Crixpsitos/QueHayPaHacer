import Link from "next/link";
import { Check, Crown, MessageCircle, Sparkles } from "lucide-react";

import { AttentionRing } from "@/app/components/motion/primitives";
import { Button } from "@/app/components/ui/button";
import type { UserParticipation, UserPlan } from "@/domain/entities/user/User";
import { cn } from "@/app/lib/utils/cn";
import {
  MEMBERSHIP_PLANS,
  getMembershipPlan,
  type MembershipPlanDefinition,
  FOUNDER_LIMIT,
  FOUNDER_MONTHS,
  formatCOP,
} from "@/presentation/profile/lib/membership";

interface MembershipSectionProps {
  currentPlan?: UserPlan;
  /** Vencimiento del Premium (ISO o Date). */
  planExpiresAt?: string | Date;
  participation?: UserParticipation;
}

function PlanFeatures({ plan }: { plan: MembershipPlanDefinition }) {
  return (
    <ul className="space-y-2.5">
      {plan.features.map((feature) => (
        <li key={feature.id} className="flex items-start gap-2 text-sm text-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
          <span className="flex-1">{feature.label}</span>
          {feature.comingSoon && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Próximamente
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MembershipSection({
  currentPlan = "basic",
  planExpiresAt,
  participation = "consumer",
}: MembershipSectionProps) {
  const activePlan = getMembershipPlan(currentPlan);
  const isPremium = currentPlan === "premium";
  const isCreator = participation === "creator";

  return (
    <section aria-label="Membresía" className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex items-start gap-3.5 border-b border-border pb-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Crown className="size-5 text-primary" aria-hidden />
        </div>
        <div>
          <h2 className="font-bold text-foreground">Tu membresía</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tu plan define las herramientas disponibles, no tu identidad ni tu verificación.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tu plan actual</p>
            <p className="mt-1 text-xl font-bold text-foreground">{activePlan.label}</p>
            {isPremium && planExpiresAt && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Activo hasta el{" "}
                {new Date(planExpiresAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })}
              </p>
            )}
          </div>
          <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
            Activo
          </span>
        </div>
      </div>

      {!isCreator && (
        <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          Premium está pensado para creadores que necesitan herramientas avanzadas para gestionar su actividad en QHPA.
        </p>
      )}

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground">Planes disponibles</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Básico es suficiente para empezar. Premium amplía tus herramientas de gestión.
          </p>
        </div>

        {Object.values(MEMBERSHIP_PLANS).map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPremiumPlan = plan.id === "premium";

          return (
            <article
              key={plan.id}
              className={cn(
                "rounded-lg border bg-background p-4",
                isPremiumPlan ? "border-primary/40" : "border-border",
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {isPremiumPlan && <Sparkles className="size-4 text-primary" aria-hidden />}
                    <h4 className="font-bold text-foreground">{plan.label}</h4>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                {isCurrent && (
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground">
                    Actual
                  </span>
                )}
              </div>

              <p className="mb-4 text-sm font-semibold text-foreground">
                {plan.monthlyPriceCOP ? (
                  <>
                    {formatCOP(plan.monthlyPriceCOP)} <span className="font-normal text-muted-foreground">al mes</span>
                  </>
                ) : (
                  "Gratis"
                )}
              </p>

              <PlanFeatures plan={plan} />

              {isPremiumPlan && !isPremium && (
                <div className="mt-5 space-y-2.5">
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Plan fundador: {FOUNDER_MONTHS} meses gratis para los primeros {FOUNDER_LIMIT} creadores.
                  </p>
                  <AttentionRing ringClassName="rounded-4xl border-primary">
                    <Button asChild className="w-full">
                      <Link href="/contactanos?motivo=premium">
                        <MessageCircle className="size-4" aria-hidden />
                        Quiero Premium
                      </Link>
                    </Button>
                  </AttentionRing>
                  <Link href="/premium" className="block text-center text-sm font-medium text-primary hover:underline">
                    Ver todo lo que incluye
                  </Link>
                </div>
              )}

              {isPremiumPlan && isPremium && (
                <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  Tienes acceso a las funciones Premium disponibles.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}