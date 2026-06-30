"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getProfessionalStatusAction } from "@/app/actions/professional/get-professional-status.action";
import { ProfessionalStatusCard } from "./ProfessionalStatusCard";
import { ProfessionalRequestForm } from "./ProfessionalRequestForm";
import type { ProfessionalStatusResult } from "@/application/services/professional/ProfessionalRequestService";

interface ProfessionalRequestSectionProps {
  uid: string;
  defaultUsername: string;
  defaultPhone: string;
}

export function ProfessionalRequestSection({ uid, defaultUsername, defaultPhone }: ProfessionalRequestSectionProps) {
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

  if (showForm) {
    return (
      <ProfessionalRequestForm
        uid={uid}
        defaultUsername={defaultUsername}
        defaultPhone={defaultPhone}
        isReapply={status.professionalStatus === "rejected"}
        previousRequest={status.latestRequest}
        onCancel={() => setShowForm(false)}
        onSubmitted={() => {
          setShowForm(false);
          setRefreshIndex((index) => index + 1);
        }}
      />
    );
  }

  return (
    <ProfessionalStatusCard
      status={status}
      onRequest={() => setShowForm(true)}
      onReapply={() => setShowForm(true)}
    />
  );
}
