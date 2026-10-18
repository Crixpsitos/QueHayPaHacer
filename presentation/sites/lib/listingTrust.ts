import type { SiteKind, SitePublishedAs, SiteVerification } from "@/domain/entities/sites/value-objects/SiteListing";

export type TrustTone = "neutral" | "warning" | "success";

export interface ListingTrust {
  /** Rótulo del nivel de confianza. */
  label: "Comunitario" | "Reclamado" | "Verificado";
  tone: TrustTone;
  description: string;
  /** Rótulo extra para atractivos sin negocio detrás. */
  kindLabel: "Atractivo público" | null;
  /** Falso solo para negocios verificados por QHPA. */
  showConfirmNotice: boolean;
}

const BY_VERIFICATION = {
  community: {
    label: "Comunitario",
    tone: "neutral",
    description: "Información aportada por la comunidad, sin verificar.",
  },
  claimed: {
    label: "Reclamado",
    tone: "warning",
    description: "Publicado por quien dice ser el dueño. QHPA no ha revisado esa afirmación.",
  },
  verified: {
    label: "Verificado",
    tone: "success",
    description: "QHPA revisó que quien administra la ficha es el dueño del lugar.",
  },
} as const;

/** Fichas sin datos (sitios viejos) se tratan como comunitarias: nunca afirmamos de más. */
export function getListingTrust(input: {
  kind?: SiteKind;
  verification?: SiteVerification;
  publishedAs?: SitePublishedAs;
}): ListingTrust {
  const kind = input.kind ?? "business";
  const level = BY_VERIFICATION[input.verification ?? "community"];
  return {
    ...level,
    kindLabel: kind === "public" ? "Atractivo público" : null,
    showConfirmNotice: !(kind === "business" && input.verification === "verified"),
  };
}
