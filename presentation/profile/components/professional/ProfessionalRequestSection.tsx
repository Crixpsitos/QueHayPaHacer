"use client";

import { useEffect, useState } from "react";
import { Briefcase, Loader2 } from "lucide-react";
import { getProfessionalStatusAction } from "@/app/actions/professional/get-professional-status.action";
import { ProfessionalStatusCard } from "./ProfessionalStatusCard";
import { ProfessionalRequestForm } from "./ProfessionalRequestForm";
import type { ProfessionalStatusResult } from "@/application/services/professional/ProfessionalRequestService";

interface ProfessionalRequestSectionProps {
  uid: string;
  defaultUsername: string;
  defaultPhone: string;
  /** Website actual del perfil — single source of truth */
  defaultWebsite: string;
}

export function ProfessionalRequestSection({
  uid,
  defaultUsername,
  defaultPhone,
  defaultWebsite,
}: ProfessionalRequestSectionProps) {
  const [status, setStatus] = useState<ProfessionalStatusResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      setIsLoading(true);
      const result = await getProfessionalStatusAction(uid);
      if (!mounted) return;
      if (result.success && result.data) {
        setStatus(result.data);
      }
      setIsLoading(false);
    };

    void loadStatus();

    return () => {
      mounted = false;
    };
  }, [uid, refreshIndex]);

  if (isLoading || !status) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Cargando estado de tu cuenta...</span>
      </div>
    );
  }

  return (
    <section aria-label="Cuenta profesional">
      {/* ── Header único — siempre visible ── */}
      <div className="mb-6 flex items-start gap-3.5 border-b border-border pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Briefcase className="size-5 text-primary" aria-hidden />
        </div>
        <div>
          <h2 className="font-bold text-foreground">Cuenta profesional</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Amplía tu presencia en{" "}
            <span className="font-medium text-foreground">Qué Hay Pa&apos; Hacer</span> y accede
            a herramientas para gestionar tus actividades.
          </p>
        </div>
      </div>

      {showForm ? (
        <ProfessionalRequestForm
          uid={uid}
          defaultUsername={defaultUsername}
          defaultPhone={defaultPhone}
          defaultWebsite={defaultWebsite}
          isReapply={status.professionalStatus === "rejected"}
          previousRequest={status.latestRequest}
          onCancel={() => setShowForm(false)}
          onSubmitted={() => {
            setShowForm(false);
            setRefreshIndex((index) => index + 1);
          }}
        />
      ) : (
        <ProfessionalStatusCard
          status={status}
          username={defaultUsername}
          onRequest={() => setShowForm(true)}
          onReapply={() => setShowForm(true)}
        />
      )}
    </section>
  );
}
