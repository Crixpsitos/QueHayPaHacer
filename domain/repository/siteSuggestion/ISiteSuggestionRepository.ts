import type { SiteSuggestion, SiteSuggestionItem } from "@/domain/entities/siteSuggestion/SiteSuggestion";
import type { RecentSubmission } from "@/domain/entities/spamGuard/spamGuard";

export interface ISiteSuggestionRepository {
  /** Sugerencias pendientes del usuario (sitio + campo). */
  pendingByAuthor(uid: string): Promise<{ siteId: string; field: string }[]>;
  /** Todas las sugerencias del usuario con fecha y texto normalizado (el filtro por ventana es en memoria). */
  recentByAuthor(uid: string): Promise<RecentSubmission[]>;
  /** Crea con `createdAt` de servidor. Devuelve su id. */
  create(suggestion: SiteSuggestion): Promise<string>;
  /** Sugerencias de un sitio (todas las del estado), sin orden. */
  listBySite(siteId: string): Promise<SiteSuggestionItem[]>;
  getSiteIdAndStatus(id: string): Promise<{ siteId: string; status: string } | null>;
  /** Resuelve solo si sigue pendiente (transacción). */
  resolve(id: string, r: { status: "applied" | "rejected"; resolvedBy: string; note?: string }): Promise<"ok" | "not_pending">;
}
