import type { SiteClaim } from "@/domain/entities/siteClaim/SiteClaim";
import type { RecentSubmission } from "@/domain/entities/spamGuard/spamGuard";

export interface ISiteClaimRepository {
  /** Ids de sitio con reclamo pendiente del usuario. */
  pendingSiteIdsByClaimant(uid: string): Promise<string[]>;
  /** Todos los reclamos del usuario con su fecha (el filtro por ventana es en memoria). */
  recentByClaimant(uid: string): Promise<RecentSubmission[]>;
  /** Crea el reclamo con `createdAt` de servidor y status "pending". Devuelve su id. */
  create(claim: SiteClaim): Promise<string>;
}
