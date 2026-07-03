import { Briefcase, Check, Clock, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { PROFESSIONAL_TYPE_LABEL } from "../../lib/professionalType";
import type { ProfessionalStatusResult } from "@/application/services/professional/ProfessionalRequestService";

interface ProfessionalStatusCardProps {
  status: ProfessionalStatusResult;
  onRequest: () => void;
  onReapply: () => void;
}

export function ProfessionalStatusCard({ status, onRequest, onReapply }: ProfessionalStatusCardProps) {
  const { professionalStatus, professionalType, latestRequest } = status;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border p-6 ${
          professionalStatus === "approved" ? "border-foreground bg-muted/40" : "border-border"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              professionalStatus === "approved" ? "bg-foreground text-background" : "border border-border"
            }`}
          >
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Cuenta Profesional</h3>
              {professionalStatus === "approved" && (
                <span className="flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
                  <Check className="h-3 w-3" />
                  {professionalType ? PROFESSIONAL_TYPE_LABEL[professionalType] : "Activa"}
                </span>
              )}
              {professionalStatus === "pending" && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  En revisión
                </span>
              )}
              {professionalStatus === "rejected" && (
                <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                  <X className="h-3 w-3" />
                  Rechazada
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Para influencers, negocios, organizaciones culturales y entidades gubernamentales.
            </p>
          </div>
        </div>
      </div>

      {professionalStatus === "pending" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
            Tu solicitud está en revisión
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
            Te avisaremos cuando el equipo revise tu solicitud. Esto puede tardar algunos días.
          </p>
        </div>
      )}

      {professionalStatus === "rejected" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">Tu solicitud fue rechazada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {latestRequest?.rejectionReason || "No se especificó un motivo."}
            </p>
          </div>
          <Button onClick={onReapply} className="h-11 w-full font-semibold">
            Volver a solicitar
          </Button>
        </div>
      )}

      {professionalStatus === "none" && (
        <>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Beneficios incluidos</h4>
            <ul className="space-y-2">
              {[
                "Estadísticas avanzadas de tus eventos",
                "Nombre público con @usuario",
                "Insignia de cuenta profesional",
                "Prioridad en búsquedas",
                "Soporte prioritario",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={onRequest} className="h-11 w-full font-semibold">
            Solicitar cambio a cuenta profesional
          </Button>
        </>
      )}
    </div>
  );
}
