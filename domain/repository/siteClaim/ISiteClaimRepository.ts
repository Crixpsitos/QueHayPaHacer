import type { SiteClaim } from "@/domain/entities/siteClaim/SiteClaim";

export interface ISiteClaimRepository {
  /** Ids de sitio con reclamo pendiente del usuario. */
  pendingSiteIdsByClaimant(uid: string): Promise<string[]>;
  /** Crea el reclamo con `createdAt` de servidor y status "pending". Devuelve su id. */
  create(claim: SiteClaim): Promise<string>;
}
