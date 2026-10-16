export const CLAIM_RELATIONS = ["owner", "legal_representative", "authorized"] as const;
export type ClaimRelation = (typeof CLAIM_RELATIONS)[number];

export type ClaimStatus = "pending" | "approved" | "rejected";

export const CLAIM_EVIDENCE_MAX = 800;
export const CLAIM_EVIDENCE_MIN = 10;
export const MAX_PENDING_CLAIMS_PER_USER = 5;

/** Reclamo de un sitio por quien dice ser su dueño/administrador. Colección `siteClaims` (solo Admin SDK). */
export interface SiteClaim {
  siteId: string;
  /** Snapshot del nombre al reclamar (el sitio puede cambiar después). */
  siteName: string;
  claimantUid: string;
  claimantName: string;
  relation: ClaimRelation;
  contactPhone?: string;
  /** Email de la cuenta (del token). */
  contactEmail: string;
  /** Texto libre: cómo se comprueba el vínculo. No se suben documentos. */
  evidence: string;
  declaration: true;
  termsVersion: string;
  status: ClaimStatus;
}

export interface ClaimSiteSnapshot {
  name: string;
  published: boolean;
  authorId: string | null;
}

/** Reglas de negocio puras. Devuelve el mensaje de error o null si el reclamo procede. */
export function claimRuleError(i: {
  site: ClaimSiteSnapshot | null;
  uid: string;
  hasPendingForSite: boolean;
  pendingCount: number;
}): string | null {
  if (!i.site || !i.site.published) return "No encontramos este lugar.";
  if (i.site.authorId === i.uid) return "Ya eres el autor de este lugar.";
  if (i.hasPendingForSite) return "Ya enviaste un reclamo para este lugar. Lo estamos revisando.";
  if (i.pendingCount >= MAX_PENDING_CLAIMS_PER_USER)
    return "Tienes varios reclamos en revisión. Espera a que los revisemos antes de enviar otro.";
  return null;
}
