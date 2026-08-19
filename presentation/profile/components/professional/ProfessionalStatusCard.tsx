import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CircleX,
  Clock,
  Landmark,
  Search,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import type { ProfessionalStatusResult } from "@/application/services/professional/ProfessionalRequestService";

interface ProfessionalStatusCardProps {
  status: ProfessionalStatusResult;
  /** Handle actual del usuario — se muestra en el estado aprobado. */
  username?: string;
  onRequest: () => void;
  onReapply: () => void;
}

const BENEFITS = [
  { icon: Users,     title: "Perfil público",          description: "Personaliza cómo te encuentran." },
  { icon: Sparkles,  title: "Identidad @usuario",      description: "Obtén tu identificador único."    },
  { icon: Search,    title: "Mayor visibilidad",        description: "Llega a más personas."            },
  { icon: BarChart3, title: "Herramientas avanzadas",   description: "Estadísticas y gestión."          },
] as const;

const TYPE_INFO: Record<
  "organizer" | "business" | "government",
  { icon: React.ElementType; label: string; description: string }
> = {
  organizer:  { icon: CalendarDays, label: "Organizador",           description: "Tu cuenta de organizador está activa."  },
  business:   { icon: Building2,    label: "Negocio",               description: "Tu cuenta de negocio está activa."      },
  government: { icon: Landmark,     label: "Entidad gubernamental", description: "Tu cuenta institucional está activa."   },
};

export function ProfessionalStatusCard({
  status,
  username,
  onRequest,
  onReapply,
}: ProfessionalStatusCardProps) {
  const { professionalStatus, professionalType, latestRequest } = status;

  const submittedDate = latestRequest?.submittedAt
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(
        new Date(latestRequest.submittedAt),
      )
    : null;

  // ── none ──────────────────────────────────────────────────────────────────
  if (professionalStatus === "none") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/25 hover:bg-primary/[0.02]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-3.5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onRequest} className="h-11 w-full bg-primary font-semibold hover:bg-primary/90">
          Solicitar cuenta profesional
        </Button>
      </div>
    );
  }

  // ── pending ────────────────────────────────────────────────────────────────
  if (professionalStatus === "pending") {
    const steps = [
      { label: "Solicitud enviada",       state: "done"    },
      { label: "Información en revisión", state: "active"  },
      { label: "Decisión",                state: "pending" },
    ] as const;

    return (
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/30">
            <Clock className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Solicitud en revisión</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tu solicitud está siendo revisada por nuestro equipo.
            </p>
            {submittedDate && (
              <p className="mt-1 text-xs text-muted-foreground">Enviada el {submittedDate}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <ol className="space-y-0" aria-label="Estado del proceso de revisión">
            {steps.map(({ label, state }, index) => (
              <li key={label} className="flex items-start gap-3">
                <div className="flex flex-col items-center" aria-hidden>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      state === "done"    && "border-foreground bg-foreground",
                      state === "active"  && "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
                      state === "pending" && "border-border bg-background",
                    )}
                  >
                    {state === "done" && <Check className="size-2.5 text-background" />}
                    {state === "active" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mt-0.5 h-5 w-px",
                        state === "done" ? "bg-foreground/25" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <p
                  className={cn(
                    "pb-3 pt-0.5 text-sm",
                    state === "done"    && "font-medium text-foreground",
                    state === "active"  && "font-medium text-amber-700 dark:text-amber-300",
                    state === "pending" && "text-muted-foreground",
                  )}
                >
                  {label}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  // ── rejected ───────────────────────────────────────────────────────────────
  if (professionalStatus === "rejected") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
            <CircleX className="size-5 text-destructive" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Solicitud no aprobada</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Puedes corregir la información y volver a solicitar.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Motivo de la revisión
            </p>
            <p className="text-sm text-amber-900 dark:text-amber-200">
              {latestRequest?.rejectionReason ??
                "Revisa la información de tu solicitud y corrige los datos antes de volver a enviarla."}
            </p>
          </div>
        </div>

        <Button onClick={onReapply} className="h-11 w-full bg-primary font-semibold hover:bg-primary/90">
          Corregir y volver a solicitar
        </Button>
      </div>
    );
  }

  // ── approved ───────────────────────────────────────────────────────────────
  const typeInfo = professionalType ? TYPE_INFO[professionalType] : null;
  const TypeIcon = typeInfo?.icon;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
          <BadgeCheck className="size-5 text-emerald-700 dark:text-emerald-400" aria-hidden />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">Cuenta profesional activa</h3>
            {typeInfo && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
                {TypeIcon && <TypeIcon className="size-3" aria-hidden />}
                {typeInfo.label}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{typeInfo?.description}</p>
        </div>
      </div>

      {(username || latestRequest?.brandName) && (
        <div className="space-y-2">
          {username && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Identificador público</p>
                <p className="font-mono text-sm font-semibold text-foreground">@{username}</p>
              </div>
            </div>
          )}
          {latestRequest?.brandName && latestRequest.brandName !== username && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <Briefcase className="size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {professionalType === "government" ? "Nombre institucional" : "Nombre comercial"}
                </p>
                <p className="text-sm font-medium text-foreground">{latestRequest.brandName}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {professionalType === "business" && (
        <Button asChild className="h-11 w-full bg-primary font-semibold hover:bg-primary/90">
          <Link href="/studio/sites">Ir al Estudio</Link>
        </Button>
      )}
    </div>
  );
}
